"use client";

import { useState, useMemo, useEffect } from "react";

const PAGE_SIZE = 20;
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteTransaction } from "@/lib/actions/transaction";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  categoryId: string;
  date: Date;
  description: string | null;
  category: { id: string; name: string; type: string };
}

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
}

export function TransactionList({ transactions, categories }: TransactionListProps) {
  const router = useRouter();

  // 筛选状态
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // 分页状态
  const [page, setPage] = useState(1);

  const hasFilter =
    keyword || typeFilter !== "ALL" || categoryFilter !== "ALL" || dateFrom || dateTo;

  function clearFilters() {
    setKeyword("");
    setTypeFilter("ALL");
    setCategoryFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  // 筛选条件变化时重置到第1页
  useEffect(() => {
    setPage(1);
  }, [keyword, typeFilter, categoryFilter, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // 关键字（备注或分类名）
      if (keyword) {
        const kw = keyword.toLowerCase();
        const match =
          t.description?.toLowerCase().includes(kw) ||
          t.category.name.toLowerCase().includes(kw);
        if (!match) return false;
      }
      // 类型
      if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
      // 分类
      if (categoryFilter !== "ALL" && t.categoryId !== categoryFilter) return false;
      // 日期范围
      const d = new Date(t.date);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [transactions, keyword, typeFilter, categoryFilter, dateFrom, dateTo]);

  // 分页计算
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 筛选后的分类列表（随类型联动）
  const filteredCategories = useMemo(() => {
    if (typeFilter === "ALL") return categories;
    return categories.filter((c) => c.type === typeFilter);
  }, [categories, typeFilter]);

  return (
    <div className="space-y-4">
      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-2 items-end">
        <Input
          placeholder="搜索备注 / 分类…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-40 h-8 text-sm"
        />
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setCategoryFilter("ALL");
          }}
        >
          <SelectTrigger className="w-24 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部</SelectItem>
            <SelectItem value="EXPENSE">支出</SelectItem>
            <SelectItem value="INCOME">收入</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-28 h-8 text-sm">
            <SelectValue placeholder="分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部分类</SelectItem>
            {filteredCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36 h-8 text-sm"
          />
          <span className="text-gray-400 text-sm">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36 h-8 text-sm"
          />
        </div>
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-gray-400 hover:text-gray-700 px-2"
            onClick={clearFilters}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            清除
          </Button>
        )}
        <span className="text-xs text-gray-400 ml-auto self-center">
          共 {filtered.length} 条
          {hasFilter && transactions.length !== filtered.length
            ? `（已筛选，共 ${transactions.length} 条）`
            : ""}
        </span>
      </div>

      {/* 列表 */}
      {filtered.length > 0 ? (
        <>
          <div className="space-y-1">
            {paged.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center rounded-lg border px-3 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {t.description || t.category.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(t.date).toLocaleDateString("zh-CN")} ·{" "}
                    <span
                      className={
                        t.type === "INCOME" ? "text-green-600" : "text-red-500"
                      }
                    >
                      {t.type === "INCOME" ? "收入" : "支出"}
                    </span>
                    {" · "}
                    {t.category.name}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                  <span
                    className={`font-bold text-sm ${
                      t.type === "INCOME" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}¥{t.amount.toFixed(2)}
                  </span>
                  <EditTransactionDialog transaction={t} categories={categories} />
                  <DeleteButton
                    onDelete={async () => {
                      await deleteTransaction(t.id);
                      router.refresh();
                    }}
                    title="删除记录"
                    description={`确定要删除「${t.description || t.category.name}」这条记录吗？`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                上一页
              </Button>
              <span className="text-sm text-muted-foreground">
                第 {page} / {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500 text-center py-8">
          {hasFilter ? "没有符合筛选条件的记录" : "暂无记录，点击右上角添加"}
        </p>
      )}
    </div>
  );
}
