import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBudgetProgress } from "@/lib/actions/budget";
import { getCategories } from "@/lib/actions/category";
import { SetBudgetDialog } from "./SetBudgetDialog";

export default async function BudgetsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const budgetProgress = await getBudgetProgress();
  const categories = await getCategories("EXPENSE");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">预算管理</h1>
        <SetBudgetDialog categories={categories} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgetProgress.length > 0 ? (
          budgetProgress.map(b => (
            <Card key={b.id} className={b.isOver ? "border-red-500 shadow-sm" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>{b.category.name}</span>
                  <span className="text-sm font-normal text-gray-500">¥{b.amount.toFixed(2)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">已花费：¥{b.spent.toFixed(2)}</span>
                    <span className={`font-medium ${b.isOver ? 'text-red-600' : b.isWarning ? 'text-yellow-600' : 'text-green-600'}`}>
                      {b.progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${b.isOver ? 'bg-red-600' : b.isWarning ? 'bg-yellow-400' : 'bg-green-500'}`}
                      style={{ width: `${b.progress}%` }}
                    ></div>
                  </div>
                  {b.isOver && <p className="text-xs text-red-500 mt-2">已超出预算！</p>}
                  {b.isWarning && !b.isOver && <p className="text-xs text-yellow-600 mt-2">即将达到预算上限。</p>}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                本月暂未设置预算，请点击右上角添加
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}