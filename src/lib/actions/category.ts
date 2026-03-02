"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCategories(type?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.category.findMany({
    where: { userId: session.user.id, ...(type ? { type } : {}) }
  });
}

export async function createCategory(name: string, type: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.category.create({
    data: { name, type, userId: session.user.id }
  });
  revalidatePath("/dashboard");
}
