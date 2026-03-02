"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getBudgets() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
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
  if (!session?.user?.id) throw new Error("Unauthorized");
  
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
  if (!session?.user?.id) throw new Error("Unauthorized");
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

  const spentMap = new Map(transactions.map(t => [t.categoryId, t._sum.amount || 0]));

  return budgets.map(b => {
    const spent = spentMap.get(b.categoryId) || 0;
    const progress = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    return {
      ...b,
      spent,
      progress: Math.min(progress, 100),
      isOver: spent > b.amount,
      isWarning: progress >= 80 && progress <= 100
    };
  });
}
