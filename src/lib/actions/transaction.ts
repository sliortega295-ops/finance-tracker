"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendBudgetExceededEmail } from "@/lib/email";

export async function createTransaction(data: { amount: number, type: string, categoryId: string, date: Date, description?: string }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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
  revalidatePath("/dashboard/transactions");
}

export async function deleteTransaction(id: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await prisma.transaction.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
}

export async function updateTransaction(
  id: string,
  data: { amount: number; type: string; categoryId: string; date: Date; description?: string }
) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await prisma.transaction.updateMany({
    where: { id, userId: session.user.id },
    data,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
}

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: startOfMonth } },
    include: { category: true },
    orderBy: { date: 'desc' }
  });

  type TxItem = (typeof transactions)[number];
  let totalIncome = 0;
  let totalExpense = 0;
  const expensesByCategory: Record<string, number> = {};

  transactions.forEach((t: TxItem) => {
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

export async function getMonthlyTrend() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const now = new Date();
  // 取最近 6 个月（含本月）
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: `${d.getMonth() + 1}月` };
  });

  const start = new Date(months[0].year, months[0].month - 1, 1);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start } },
    select: { type: true, amount: true, date: true },
  });

  const map: Record<string, { income: number; expense: number }> = {};
  for (const { year, month, label } of months) {
    map[`${year}-${month}`] = { income: 0, expense: 0 };
    void label;
  }

  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!map[key]) continue;
    if (t.type === "INCOME") map[key].income += t.amount;
    else map[key].expense += t.amount;
  }

  return months.map(({ year, month, label }) => ({
    label,
    income: map[`${year}-${month}`]?.income ?? 0,
    expense: map[`${year}-${month}`]?.expense ?? 0,
  }));
}

export async function importTransactions(
  rows: { date: string; type: string; categoryName: string; amount: number; description?: string }[]
) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // 获取用户的所有分类，构建名称→id 映射
  const categories = await prisma.category.findMany({ where: { userId } });
  const catMap = new Map(categories.map((c) => [`${c.type}:${c.name}`, c.id]));

  const records: { userId: string; categoryId: string; amount: number; type: string; date: Date; description?: string }[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // CSV 第 1 行是标题

    const type = row.type?.toUpperCase();
    if (type !== "INCOME" && type !== "EXPENSE") {
      errors.push(`第 ${rowNum} 行：类型必须是 INCOME 或 EXPENSE`);
      continue;
    }

    const categoryId = catMap.get(`${type}:${row.categoryName}`);
    if (!categoryId) {
      errors.push(`第 ${rowNum} 行：找不到分类「${row.categoryName}」（${type === "INCOME" ? "收入" : "支出"}），请先在分类管理中创建`);
      continue;
    }

    const date = new Date(row.date);
    if (isNaN(date.getTime())) {
      errors.push(`第 ${rowNum} 行：日期格式错误「${row.date}」，应为 YYYY-MM-DD`);
      continue;
    }

    if (!row.amount || row.amount <= 0) {
      errors.push(`第 ${rowNum} 行：金额无效`);
      continue;
    }

    records.push({ userId, categoryId, amount: row.amount, type, date, description: row.description || undefined });
  }

  if (records.length > 0) {
    await prisma.transaction.createMany({ data: records });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");

  return { imported: records.length, errors };
}
