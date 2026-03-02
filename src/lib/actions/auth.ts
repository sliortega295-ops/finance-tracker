"use server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

const registerSchema = z.object({
  name: z.string().min(1, "请输入姓名"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少需要6位字符"),
});

export async function registerUser(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse(data);

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "该邮箱已被注册" };

  const hashedPassword = await bcrypt.hash(password as string, 10);

  try {
    await prisma.user.create({
      data: {
        name: name as string,
        email: email as string,
        password: hashedPassword,
        categories: {
          create: [
            { name: "工资", type: "INCOME" },
            { name: "餐饮", type: "EXPENSE" },
            { name: "交通", type: "EXPENSE" },
            { name: "住房", type: "EXPENSE" },
          ]
        }
      }
    });
  } catch {
    return { error: "注册失败，请重试" };
  }
  // signIn 成功时会抛出 NEXT_REDIRECT，必须在 try/catch 外调用，让跳转正常传播
  await signIn("credentials", { email, password, redirectTo: "/" });
}

export async function loginUser(formData: FormData) {
  try {
    await signIn("credentials", {
      ...Object.fromEntries(formData.entries()),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: '邮箱或密码错误' };
        default:
          return { error: '登录出现异常，请重试' };
      }
    }
    throw error;
  }
}