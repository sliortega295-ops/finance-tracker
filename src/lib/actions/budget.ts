"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getBudgets() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return prisma.budget.findMany({
    where: { 
      userId: session.user.id,
      month: currentMonth,
      year: currentYear
    },
    include: { category: true }
  });
}

export async function setBudget(categoryId: string, amount: number) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await prisma.budget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId: session.user.id,
        categoryId,
        month,
        year
      }
    },
    update: { amount },
    create: {
      userId: session.user.id,
      categoryId,
      amount,
      month,
      year
    }
  });
  
  revalidatePath("/dashboard/budgets");
}

export async function getBudgetProgress() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true }
  });

  const transactions = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      date: { gte: startOfMonth },
      type: "EXPENSE"
    },
    _sum: { amount: true }
  });

  type GroupedTransaction = (typeof transactions)[number];
  const spentMap = new Map<string, number>(
    transactions.map((t: GroupedTransaction): [string, number] => [
      t.categoryId,
      Number(t._sum.amount ?? 0),
    ])
  );

  type BudgetItem = (typeof budgets)[number];
  return budgets.map((b: BudgetItem) => {
    const spent = Number(spentMap.get(b.categoryId) ?? 0);
    const budgetAmount = Number(b.amount);
    const progress = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
    return {
      ...b,
      spent,
      progress: Math.min(progress, 100),
      isOver: spent > budgetAmount,
      isWarning: progress >= 80 && progress <= 100
    };
  });
}
export async function deleteBudget(id: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await prisma.budget.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/dashboard/budgets");
}

export async function updateBudget(id: string, amount: number) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await prisma.budget.updateMany({
    where: { id, userId: session.user.id },
    data: { amount },
  });

  revalidatePath("/dashboard/budgets");
}

/**
 * 多月预算对比：返回最近 N 个月（默认3个月）每个支出分类的预算 vs 实际支出。
 */
export async function getBudgetComparison(monthCount = 3) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const now = new Date();

  // 生成最近 monthCount 个月的列表（从最早到最近）
  const months: { year: number; month: number; label: string }[] = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }

  // 取这段时间内所有预算
  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      OR: months.map((m) => ({ year: m.year, month: m.month })),
    },
    include: { category: true },
  });

  const startDate = new Date(months[0].year, months[0].month - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // 取这段时间内所有支出交易（含日期，手动按月分组）
  const txByMonth = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: startDate, lte: endDate },
    },
    select: { categoryId: true, amount: true, date: true },
  });

  // 收集所有涉及分类
  const categoryMap = new Map<string, { id: string; name: string }>();
  for (const b of budgets) {
    categoryMap.set(b.categoryId, { id: b.categoryId, name: b.category.name });
  }

  // 补查只有交易、没有预算的分类名称
  const txCategoryIds = [...new Set(txByMonth.map((t) => t.categoryId))];
  const newIds = txCategoryIds.filter((id) => !categoryMap.has(id));
  if (newIds.length > 0) {
    const txCategories = await prisma.category.findMany({
      where: { id: { in: newIds } },
      select: { id: true, name: true },
    });
    for (const c of txCategories) categoryMap.set(c.id, c);
  }

  // spentMap: categoryId -> monthLabel -> amount
  const spentMap = new Map<string, Map<string, number>>();
  for (const tx of txByMonth) {
    const d = new Date(tx.date);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!spentMap.has(tx.categoryId)) spentMap.set(tx.categoryId, new Map());
    const inner = spentMap.get(tx.categoryId)!;
    inner.set(label, (inner.get(label) ?? 0) + tx.amount);
  }

  // budgetMap: categoryId -> monthLabel -> amount
  const budgetMap = new Map<string, Map<string, number>>();
  for (const b of budgets) {
    const label = `${b.year}-${String(b.month).padStart(2, "0")}`;
    if (!budgetMap.has(b.categoryId)) budgetMap.set(b.categoryId, new Map());
    budgetMap.get(b.categoryId)!.set(label, b.amount);
  }

  type MonthData = { label: string; budget: number; spent: number };
  type CategoryRow = { categoryId: string; categoryName: string; months: MonthData[] };

  const rows: CategoryRow[] = [...categoryMap.keys()].map((catId) => ({
    categoryId: catId,
    categoryName: categoryMap.get(catId)?.name ?? catId,
    months: months.map((m) => ({
      label: m.label,
      budget: budgetMap.get(catId)?.get(m.label) ?? 0,
      spent: spentMap.get(catId)?.get(m.label) ?? 0,
    })),
  }));

  // 过滤全空行，按分类名排序
  const nonEmpty = rows
    .filter((r) => r.months.some((m) => m.budget > 0 || m.spent > 0))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName, "zh-CN"));

  return { months: months.map((m) => m.label), rows: nonEmpty };
}