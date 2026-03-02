import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/actions/settings";
import { ProfileForm } from "./ProfileForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await getProfile();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">个人中心</h1>
        <p className="text-gray-500 mt-1">管理您的账户信息与安全设置</p>
      </div>
      <ProfileForm user={user} />
    </div>
  );
}
