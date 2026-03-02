"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type RecurringTransactionData = {
  categoryId: string;
  amount: number;
  type: string;
  dayOfMonth: number;
  description?: string;
};

/** 获取当前用户所有定期记录 */
export async function getRecurringTransactions() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return prisma.recurringTransaction.findMany({
    where: { userId: session.user.id },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });
}

/** 创建定期记录 */
export async function createRecurringTransaction(data: RecurringTransactionData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (data.dayOfMonth < 1 || data.dayOfMonth > 28) {
    return { error: "触发日期必须在 1-28 之间" };
  }
  if (data.amount <= 0) {
    return { error: "金额必须大于 0" };
  }

  await prisma.recurringTransaction.create({
    data: {
      userId: session.user.id,
      categoryId: data.categoryId,
      amount: data.amount,
      type: data.type,
      dayOfMonth: data.dayOfMonth,
      description: data.description,
    },
  });

  revalidatePath("/transactions");
  return { success: true };
}

/** 删除定期记录（仅限本人） */
export async function deleteRecurringTransaction(id: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await prisma.recurringTransaction.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/transactions");
}

/** 切换定期记录的启用状态 */
export async function toggleRecurringTransaction(id: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const record = await prisma.recurringTransaction.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!record) return;

  await prisma.recurringTransaction.update({
    where: { id },
    data: { isActive: !record.isActive },
  });

  revalidatePath("/transactions");
}

/**
 * 检查并生成本月应触发的定期记录。
 * 触发条件：isActive=true，dayOfMonth <= 今天的日期，且本月尚未生成过（lastApplied 不在本月）。
 * 在访问收支页时调用，避免遗漏。
 */
export async function applyDueRecurringTransactions() {
  const session = await auth();
  if (!session?.user?.id) return;

  const now = new Date();
  const today = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  // 取所有启用、触发日 <= 今天的定期记录
  const dueSeries = await prisma.recurringTransaction.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
      dayOfMonth: { lte: today },
    },
  });

  for (const rec of dueSeries) {
    // 本月是否已生成过
    const alreadyApplied =
      rec.lastApplied !== null &&
      rec.lastApplied >= startOfMonth &&
      rec.lastApplied <= endOfMonth;

    if (alreadyApplied) continue;

    const triggerDate = new Date(year, month, rec.dayOfMonth);

    await prisma.transaction.create({
      data: {
        userId: rec.userId,
        categoryId: rec.categoryId,
        amount: rec.amount,
        type: rec.type,
        date: triggerDate,
        description: rec.description ?? `定期记录（每月${rec.dayOfMonth}日）`,
      },
    });

    await prisma.recurringTransaction.update({
      where: { id: rec.id },
      data: { lastApplied: now },
    });
  }

  // 仅当有新记录生成时才刷新缓存
  if (dueSeries.length > 0) {
    revalidatePath("/transactions");
  }
}
