"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendBudgetExceededEmail } from "@/lib/email";

export async function createTransaction(data: { amount: number, type: string, categoryId: string, date: Date, description?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.transaction.create({
    data: { ...data, userId: session.user.id }
  });

  // 只检查支出类交易是否超出预算
  if (data.type === "EXPENSE") {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budget = await prisma.budget.findUnique({
      where: {
        userId_categoryId_month_year: {
          userId: session.user.id,
          categoryId: data.categoryId,
          month,
          year,
        },
      },
      include: { category: true },
    });

    if (budget) {
      const agg = await prisma.transaction.aggregate({
        where: {
          userId: session.user.id,
          categoryId: data.categoryId,
          type: "EXPENSE",
          date: { gte: startOfMonth },
        },
        _sum: { amount: true },
      });
      const spent = agg._sum.amount ?? 0;

      if (spent > budget.amount) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { email: true, name: true },
        });
        if (user?.email) {
          // 异步发送，不阻塞主流程
          sendBudgetExceededEmail({
            to: user.email,
            userName: user.name ?? "用户",
            categoryName: budget.category.name,
            budgetAmount: budget.amount,
            spentAmount: spent,
          }).catch(console.error);
        }
      }
    }
  }

  revalidatePath("/dashboard");
}

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: startOfMonth } },
    include: { category: true },
    orderBy: { date: 'desc' }
  });

  let totalIncome = 0;
  let totalExpense = 0;
  const expensesByCategory: Record<string, number> = {};

  transactions.forEach(t => {
    if (t.type === "INCOME") totalIncome += t.amount;
    if (t.type === "EXPENSE") {
      totalExpense += t.amount;
      expensesByCategory[t.category.name] = (expensesByCategory[t.category.name] || 0) + t.amount;
    }
  });

  const pieChartData = Object.keys(expensesByCategory).map(name => ({
    name,
    value: expensesByCategory[name]
  }));

  return { totalIncome, totalExpense, balance: totalIncome - totalExpense, pieChartData, recentTransactions: transactions.slice(0, 5) };
}
