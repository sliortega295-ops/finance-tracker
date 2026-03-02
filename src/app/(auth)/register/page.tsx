"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/lib/actions/auth";
import Link from "next/link";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const res = await registerUser(formData);
    if (res?.error) {
      setError(res.error);
      setPending(false);
    }
    // 注册成功时 registerUser 内部直接触发 signIn 跳转，无需额外处理
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>创建账号</CardTitle>
        <CardDescription>开始管理您的收支</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input id="name" name="name" type="text" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "注册中..." : "注册"}
          </Button>
          <p className="text-center text-sm text-gray-500 mt-4">
            已有账号？<Link href="/login" className="text-blue-500 hover:underline">立即登录</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}