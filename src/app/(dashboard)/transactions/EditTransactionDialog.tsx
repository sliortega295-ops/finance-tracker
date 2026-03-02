"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateTransaction } from "@/lib/actions/transaction";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  categoryId: string;
  date: Date;
  description: string | null;
  category: { id: string; name: string; type: string };
}

interface Category {
  id: string;
  name: string;
  type: string;
}

export function EditTransactionDialog({
  transaction,
  categories,
}: {
  transaction: Transaction;
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(transaction.type);
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const filteredCategories = categories.filter((c) => c.type === type);

  // 切换收支类型时重置分类选择
  function handleTypeChange(val: string) {
    setType(val);
    setCategoryId("");
  }

  async function handleSubmit(formData: FormData) {
    const selCategoryId = categoryId || (formData.get("categoryId") as string);
    if (!selCategoryId) {
      toast.error("请选择分类");
      return;
    }
    setPending(true);
    try {
      await updateTransaction(transaction.id, {
        amount: parseFloat(formData.get("amount") as string),
        type,
        categoryId: selCategoryId,
        date: new Date(formData.get("date") as string),
        description: (formData.get("description") as string) || undefined,
      });
      toast.success("记录已更新");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("更新失败，请重试");
    } finally {
      setPending(false);
    }
  }

  const defaultDate = new Date(transaction.date).toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-blue-500 hover:bg-blue-50"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑收支记录</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {/* 类型 */}
          <div className="space-y-2">
            <Label>类型</Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">支出</SelectItem>
                <SelectItem value="INCOME">收入</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 金额 */}
          <div className="space-y-2">
            <Label>金额</Label>
            <Input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={transaction.amount}
            />
          </div>

          {/* 日期 */}
          <div className="space-y-2">
            <Label>日期</Label>
            <Input name="date" type="date" required defaultValue={defaultDate} />
          </div>

          {/* 分类 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>分类</Label>
              <Link
                href="/categories"
                className="text-xs text-blue-500 hover:underline"
                onClick={() => setOpen(false)}
              >
                管理分类
              </Link>
            </div>
            <Select
              name="categoryId"
              value={categoryId}
              onValueChange={setCategoryId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label>备注（可选）</Label>
            <Input
              name="description"
              placeholder="如：午餐"
              defaultValue={transaction.description ?? ""}
            />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "保存中…" : "保存修改"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
