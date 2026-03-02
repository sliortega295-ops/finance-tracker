import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBudgetProgress, getBudgetComparison } from "@/lib/actions/budget";
import { getCategories } from "@/lib/actions/category";
import { SetBudgetDialog } from "./SetBudgetDialog";
import { EditBudgetDialog } from "./EditBudgetDialog";
import { deleteBudget } from "@/lib/actions/budget";
import { DeleteButton } from "@/components/ui/delete-button";

type BudgetProgressItem = Awaited<ReturnType<typeof getBudgetProgress>>[number];

export default async function BudgetsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [budgetProgress, categories, comparison] = await Promise.all([
    getBudgetProgress(),
    getCategories("EXPENSE"),
    getBudgetComparison(3),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">预算管理</h1>
        <SetBudgetDialog categories={categories} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgetProgress.length > 0 ? (
          budgetProgress.map((b: BudgetProgressItem) => (
            <Card key={b.id} className={b.isOver ? "border-red-500 shadow-sm" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>{b.category.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-normal text-gray-500">¥{b.amount.toFixed(2)}</span>
                    <EditBudgetDialog
                      budgetId={b.id}
                      categoryName={b.category.name}
                      currentAmount={b.amount}
                    />
                    <DeleteButton
                      onDelete={deleteBudget.bind(null, b.id)}
                      title="删除预算"
                      description={`确定要删除「${b.category.name}」的本月预算吗？`}
                    />
                  </div>
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

      {/* 多月预算对比 */}
      {comparison.rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">近 3 个月预算对比</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-28">分类</th>
                  {comparison.months.map((m) => (
                    <th key={m} className="text-center py-2 px-3 font-medium text-muted-foreground" colSpan={2}>
                      {m}
                    </th>
                  ))}
                </tr>
                <tr className="border-b text-xs text-muted-foreground">
                  <th />
                  {comparison.months.map((m) => (
                    <React.Fragment key={m}>
                      <th className="text-center pb-1.5 px-2">预算</th>
                      <th className="text-center pb-1.5 px-2">实际</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row) => (
                  <tr key={row.categoryId} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-2 pr-4 font-medium">{row.categoryName}</td>
                    {row.months.map((m) => {
                      const over = m.budget > 0 && m.spent > m.budget;
                      return (
                        <React.Fragment key={m.label}>
                          <td className="text-center px-2 tabular-nums text-muted-foreground">
                            {m.budget > 0 ? `¥${m.budget.toFixed(0)}` : "—"}
                          </td>
                          <td
                            className={`text-center px-2 tabular-nums font-medium ${
                              over ? "text-red-600" : m.spent > 0 ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {m.spent > 0 ? `¥${m.spent.toFixed(0)}` : "—"}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}