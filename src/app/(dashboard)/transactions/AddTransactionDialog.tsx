"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createTransaction } from "@/lib/actions/transaction";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AddTransactionDialog({ categories }: { categories: { id: string; name: string; type: string }[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("EXPENSE");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const filteredCategories = categories.filter(c => c.type === type);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await createTransaction({
        amount: parseFloat(formData.get("amount") as string),
        type,
        categoryId: formData.get("categoryId") as string,
        date: new Date(formData.get("date") as string),
        description: formData.get("description") as string,
      });
      toast.success("记录添加成功！");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("添加失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>添加记录</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加收支记录</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>类型</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">支出</SelectItem>
                <SelectItem value="INCOME">收入</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>金额</Label>
            <Input name="amount" type="number" step="0.01" min="0" required />
          </div>

          <div className="space-y-2">
            <Label>日期</Label>
            <Input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
          </div>

          <div className="space-y-2">
            <Label>分类</Label>
            <Select name="categoryId" required>
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>备注（可选）</Label>
            <Input name="description" placeholder="如：午餐" />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "添加中..." : "添加"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}