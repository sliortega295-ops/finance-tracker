"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function getCategories(type?: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return prisma.category.findMany({
    where: { userId: session.user.id, ...(type ? { type } : {}) },
    orderBy: { createdAt: "asc" },
  });
}

export async function createCategory(name: string, type: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("分类名称不能为空");

  // 同类型下名称唯一（schema 约束兜底）
  const existing = await prisma.category.findUnique({
    where: { userId_name_type: { userId: session.user.id, name: trimmed, type } },
  });
  if (existing) throw new Error("该类型下已存在同名分类");

  await prisma.category.create({
    data: { name: trimmed, type, userId: session.user.id },
  });
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/budgets");
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // 检查是否有关联交易记录
  const txCount = await prisma.transaction.count({
    where: { categoryId: id, userId: session.user.id },
  });
  if (txCount > 0) {
    throw new Error(`该分类下还有 ${txCount} 条记录，无法删除`);
  }

  await prisma.category.deleteMany({
    where: { id, userId: session.user.id },
  });
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/budgets");
}
