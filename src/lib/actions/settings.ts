"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getAccountStats() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [txTotal, monthlyAgg, categoryCount, budgetCount] = await Promise.all([
    prisma.transaction.count({ where: { userId } }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.category.count({ where: { userId } }),
    prisma.budget.count({
      where: {
        userId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    }),
  ]);

  const monthIncome =
    monthlyAgg.find((r) => r.type === "INCOME")?._sum.amount ?? 0;
  const monthExpense =
    monthlyAgg.find((r) => r.type === "EXPENSE")?._sum.amount ?? 0;

  return { txTotal, monthIncome, monthExpense, categoryCount, budgetCount };
}

export async function getProfile() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, createdAt: true },
  });
}

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };

  const name = formData.get("name") as string;
  if (!name?.trim()) return { error: "姓名不能为空" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name.trim() },
  });
  revalidatePath("/settings");
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword.length < 6) return { error: "新密码至少需要6位字符" };
  if (newPassword !== confirmPassword) return { error: "两次输入的新密码不一致" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) return { error: "账户异常" };

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) return { error: "当前密码错误" };

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });
  return { success: true };
}
