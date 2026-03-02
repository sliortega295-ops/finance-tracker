"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function exportTransactionsCSV() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    include: { category: true },
    orderBy: { date: "desc" }
  });

  const header = "Date,Type,Category,Amount,Description\n";
  const rows = transactions.map(t => {
    const date = new Date(t.date).toISOString().split('T')[0];
    const desc = t.description ? `"${t.description.replace(/"/g, '""')}"` : "";
    return `${date},${t.type},"${t.category.name}",${t.amount},${desc}`;
  }).join("\n");

  return header + rows;
}
