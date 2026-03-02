"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateBudget } from "@/lib/actions/budget";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function EditBudgetDialog({
  budgetId,
  categoryName,
  currentAmount,
}: {
  budgetId: string;
  categoryName: string;
  currentAmount: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const amount = parseFloat(formData.get("amount") as string);
    if (!amount || amount <= 0) {
      toast.error("请输入有效金额");
      return;
    }
    setPending(true);
    try {
      await updateBudget(budgetId, amount);
      toast.success("预算已更新");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("更新失败，请重试");
    } finally {
      setPending(false);
    }
  }

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
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>编辑预算 · {categoryName}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>月度限额（元）</Label>
            <Input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={currentAmount}
              autoFocus
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
