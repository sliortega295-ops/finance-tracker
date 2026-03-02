import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCategories, deleteCategory } from "@/lib/actions/category";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { DeleteButton } from "@/components/ui/delete-button";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allCategories = await getCategories();
  const expenses = allCategories.filter((c) => c.type === "EXPENSE");
  const incomes = allCategories.filter((c) => c.type === "INCOME");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">分类管理</h1>
        <AddCategoryDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 支出分类 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex justify-between items-center text-lg">
              <div className="flex items-center gap-2">
                <span>支出分类</span>
                <Badge variant="secondary">{expenses.length}</Badge>
              </div>
              <AddCategoryDialog defaultType="EXPENSE" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length > 0 ? (
              <ul className="space-y-2">
                {expenses.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{c.name}</span>
                    <DeleteButton
                      onDelete={deleteCategory.bind(null, c.id)}
                      title="删除分类"
                      description={`确定要删除支出分类「${c.name}」吗？若该分类下有交易记录则无法删除。`}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                暂无支出分类
              </p>
            )}
          </CardContent>
        </Card>

        {/* 收入分类 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex justify-between items-center text-lg">
              <div className="flex items-center gap-2">
                <span>收入分类</span>
                <Badge variant="secondary">{incomes.length}</Badge>
              </div>
              <AddCategoryDialog defaultType="INCOME" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomes.length > 0 ? (
              <ul className="space-y-2">
                {incomes.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{c.name}</span>
                    <DeleteButton
                      onDelete={deleteCategory.bind(null, c.id)}
                      title="删除分类"
                      description={`确定要删除收入分类「${c.name}」吗？若该分类下有交易记录则无法删除。`}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                暂无收入分类
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-gray-400">
        提示：有交易记录关联的分类无法删除，请先删除相关记录。
      </p>
    </div>
  );
}
