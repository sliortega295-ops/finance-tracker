"use client";
import { useState, useTransition } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringTransaction,
} from "@/lib/actions/recurring";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RepeatIcon, Trash2, Power, PowerOff, PlusCircle } from "lucide-react";

type Category = { id: string; name: string; type: string };

type RecurringItem = {
  id: string;
  amount: number;
  type: string;
  dayOfMonth: number;
  description: string | null;
  isActive: boolean;
  lastApplied: Date | null;
  category: Category;
};

export function RecurringDialog({
  categories,
  recurring,
}: {
  categories: Category[];
  recurring: RecurringItem[];
}) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("EXPENSE");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filteredCategories = categories.filter((c) => c.type === formType);

  async function handleCreate(formData: FormData) {
    const amount = parseFloat(formData.get("amount") as string);
    const categoryId = formData.get("categoryId") as string;
    const dayOfMonth = parseInt(formData.get("dayOfMonth") as string, 10);
    const description = (formData.get("description") as string) || undefined;

    startTransition(async () => {
      const res = await createRecurringTransaction({
        categoryId,
        amount,
        type: formType,
        dayOfMonth,
        description,
      });
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("定期记录已创建");
        setShowForm(false);
        router.refresh();
      }
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      await deleteRecurringTransaction(id);
      toast.success("已删除");
      router.refresh();
    });
  }

  async function handleToggle(id: string) {
    startTransition(async () => {
      await toggleRecurringTransaction(id);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <RepeatIcon className="h-4 w-4" />
          定期记录
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>管理定期记录</DialogTitle>
        </DialogHeader>

        {/* 现有定期记录列表 */}
        {recurring.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            暂无定期记录，点击下方按钮创建
          </p>
        ) : (
          <ul className="space-y-2">
            {recurring.map((rec) => (
              <li
                key={rec.id}
                className="flex items-center justify-between rounded-md border p-3 gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{rec.category.name}</span>
                    <Badge
                      variant={rec.type === "INCOME" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {rec.type === "INCOME" ? "收入" : "支出"}
                    </Badge>
                    {!rec.isActive && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        已暂停
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    每月 {rec.dayOfMonth} 日 &nbsp;·&nbsp;
                    <span
                      className={
                        rec.type === "INCOME" ? "text-green-600" : "text-red-600"
                      }
                    >
                      ¥{rec.amount.toFixed(2)}
                    </span>
                    {rec.description && (
                      <span className="ml-1 text-xs">· {rec.description}</span>
                    )}
                  </p>
                  {rec.lastApplied && (
                    <p className="text-xs text-muted-foreground">
                      上次触发：{new Date(rec.lastApplied).toLocaleDateString("zh-CN")}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    title={rec.isActive ? "暂停" : "启用"}
                    disabled={isPending}
                    onClick={() => handleToggle(rec.id)}
                  >
                    {rec.isActive ? (
                      <Power className="h-4 w-4 text-green-600" />
                    ) : (
                      <PowerOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="删除"
                    disabled={isPending}
                    onClick={() => handleDelete(rec.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* 新建表单 */}
        {showForm ? (
          <form action={handleCreate} className="border rounded-md p-4 space-y-3 mt-2">
            <p className="text-sm font-medium">新建定期记录</p>

            {/* 类型 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">类型</Label>
                <Select
                  value={formType}
                  onValueChange={(v) => setFormType(v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">支出</SelectItem>
                    <SelectItem value="INCOME">收入</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs" htmlFor="rec-day">
                  每月几号触发（1–28）
                </Label>
                <Input
                  id="rec-day"
                  name="dayOfMonth"
                  type="number"
                  min={1}
                  max={28}
                  defaultValue={1}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            {/* 分类 */}
            <div>
              <Label className="text-xs" htmlFor="rec-cat">
                分类
              </Label>
              <Select name="categoryId" required>
                <SelectTrigger id="rec-cat" className="mt-1">
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

            {/* 金额 */}
            <div>
              <Label className="text-xs" htmlFor="rec-amount">
                金额（元）
              </Label>
              <Input
                id="rec-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                className="mt-1"
                placeholder="0.00"
              />
            </div>

            {/* 备注 */}
            <div>
              <Label className="text-xs" htmlFor="rec-desc">
                备注（可选）
              </Label>
              <Input id="rec-desc" name="description" className="mt-1" placeholder="例如：房租、工资…" />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                取消
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "保存中…" : "保存"}
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            className="w-full gap-1.5 mt-2"
            onClick={() => setShowForm(true)}
          >
            <PlusCircle className="h-4 w-4" />
            新建定期记录
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
