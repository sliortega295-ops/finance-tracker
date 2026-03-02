import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { getCategories } from "@/lib/actions/category";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    include: { category: true },
    orderBy: { date: "desc" }
  });

  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">收支记录</h1>
        <AddTransactionDialog categories={categories} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>全部记录</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map(t => (
                <div key={t.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{t.description || t.category.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(t.date).toLocaleDateString()} · {t.category.name}
                    </p>
                  </div>
                  <div className={`font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}¥{t.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">暂无记录，点击右上角添加</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}