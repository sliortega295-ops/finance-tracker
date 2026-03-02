"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { updateProfile, updatePassword } from "@/lib/actions/settings";
import { exportTransactionsCSV } from "@/lib/actions/export";
import { toast } from "sonner";
import {
  User,
  Mail,
  CalendarDays,
  ReceiptText,
  TrendingUp,
  TrendingDown,
  Tag,
  Download,
  ShieldCheck,
} from "lucide-react";

interface ProfileFormProps {
  user: { id: string; name: string | null; email: string | null; createdAt: Date };
  stats: {
    txTotal: number;
    monthIncome: number;
    monthExpense: number;
    categoryCount: number;
    budgetCount: number;
  };
}

export function ProfileForm({ user, stats }: ProfileFormProps) {
  const [profilePending, setProfilePending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);
  const [exportPending, setExportPending] = useState(false);

  const initials = (user.name ?? user.email ?? "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  const joinedDays = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / 86400000
  );

  async function handleProfileSubmit(formData: FormData) {
    setProfilePending(true);
    const res = await updateProfile(formData);
    setProfilePending(false);
    if (res?.error) toast.error(res.error);
    else toast.success("个人信息已更新");
  }

  async function handlePasswordSubmit(formData: FormData) {
    setPasswordPending(true);
    const res = await updatePassword(formData);
    setPasswordPending(false);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("密码修改成功");
      (document.getElementById("password-form") as HTMLFormElement)?.reset();
    }
  }

  async function handleExport() {
    setExportPending(true);
    try {
      const csv = await exportTransactionsCSV();
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `收支记录_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("导出成功！");
    } catch {
      toast.error("导出失败，请重试");
    } finally {
      setExportPending(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── 头像 & 基础信息 ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* 头像 */}
            <div className="flex-shrink-0 w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold select-none">
              {initials}
            </div>
            {/* 文字信息 */}
            <div className="flex-1 space-y-1 text-center sm:text-left">
              <p className="text-xl font-semibold">{user.name ?? "未设置姓名"}</p>
              <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1">
                <Mail className="h-3.5 w-3.5" />{user.email}
              </p>
              <p className="text-sm text-gray-400 flex items-center justify-center sm:justify-start gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                注册于 {new Date(user.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                &nbsp;· 已使用 {joinedDays} 天
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 账户统计 ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: ReceiptText, label: "累计记录", value: `${stats.txTotal} 笔`, color: "text-blue-600" },
          { icon: TrendingUp,  label: "本月收入", value: `¥${stats.monthIncome.toFixed(0)}`, color: "text-green-600" },
          { icon: TrendingDown, label: "本月支出", value: `¥${stats.monthExpense.toFixed(0)}`, color: "text-red-500" },
          { icon: Tag,         label: "分类数量", value: `${stats.categoryCount} 个`, color: "text-purple-600" },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
              <Icon className={`h-5 w-5 ${color}`} />
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── 数据导出 ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            数据导出
          </CardTitle>
          <CardDescription>将您的全部收支记录导出为 CSV 文件，可用 Excel 打开</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExport} disabled={exportPending}>
            {exportPending ? "导出中…" : "下载 CSV"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* ── 修改姓名 ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            基本信息
          </CardTitle>
          <CardDescription>修改您的显示姓名</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input id="name" name="name" defaultValue={user.name ?? ""} required maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input value={user.email ?? ""} disabled className="bg-gray-50 text-gray-500" />
              <p className="text-xs text-gray-400">邮箱不可修改，超支提醒将发送至此邮箱</p>
            </div>
            <Button type="submit" disabled={profilePending}>
              {profilePending ? "保存中…" : "保存修改"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── 修改密码 ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            修改密码
          </CardTitle>
          <CardDescription>请输入当前密码以验证身份</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="password-form" action={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">当前密码</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input id="newPassword" name="newPassword" type="password" required minLength={6} placeholder="至少 6 位" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} />
            </div>
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? "更新中…" : "更新密码"}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
