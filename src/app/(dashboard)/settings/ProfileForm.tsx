"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { updateProfile, updatePassword } from "@/lib/actions/settings";
import { toast } from "sonner";

interface ProfileFormProps {
  user: { id: string; name: string | null; email: string | null; createdAt: Date };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [profilePending, setProfilePending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);

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

  return (
    <div className="space-y-6 max-w-xl">
      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>修改您的姓名</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input id="name" name="name" defaultValue={user.name ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input value={user.email ?? ""} disabled className="bg-gray-50 text-gray-500" />
              <p className="text-xs text-gray-400">邮箱不可修改，超支提醒将发送至此邮箱</p>
            </div>
            <div className="space-y-2">
              <Label>注册时间</Label>
              <Input
                value={new Date(user.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                disabled
                className="bg-gray-50 text-gray-500"
              />
            </div>
            <Button type="submit" disabled={profilePending}>
              {profilePending ? "保存中..." : "保存修改"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* 修改密码 */}
      <Card>
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
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
              <Input id="newPassword" name="newPassword" type="password" required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} />
            </div>
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? "更新中..." : "更新密码"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
