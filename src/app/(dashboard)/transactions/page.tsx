import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { ImportTransactionsDialog } from "./ImportTransactionsDialog";
import { RecurringDialog } from "./RecurringDialog";
import { TransactionList } from "./TransactionList";
import { getCategories } from "@/lib/actions/category";
import { getRecurringTransactions, applyDueRecurringTransactions } from "@/lib/actions/recurring";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // 每次访问本页时自动触发本月到期的定期记录
  await applyDueRecurringTransactions();

  const [transactions, categories, recurring] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.user.id! },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    getCategories(),
    getRecurringTransactions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">收支记录</h1>
        <div className="flex gap-2 flex-wrap">
          <RecurringDialog categories={categories} recurring={recurring} />
          <ImportTransactionsDialog />
          <AddTransactionDialog categories={categories} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>全部记录</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={transactions} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
