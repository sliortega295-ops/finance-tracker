"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { setBudget } from "@/lib/actions/budget";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SetBudgetDialog({ categories }: { categories: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await setBudget(
        formData.get("categoryId") as string,
        parseFloat(formData.get("amount") as string)
      );
      toast.success("预算设置成功！");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("预算设置失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>设置预算</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>设置月度预算</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>分类</Label>
            <Select name="categoryId" required>
              <SelectTrigger>
                <SelectValue placeholder="选择支出分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>月度限额（元）</Label>
            <Input name="amount" type="number" step="0.01" min="0.01" required />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "保存中..." : "保存"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}