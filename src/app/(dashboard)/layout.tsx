import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
        <div className="font-bold text-xl mb-4 text-blue-600">FinanceTracker</div>
        <nav className="flex flex-col gap-2 flex-grow">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-md font-medium text-gray-700">总览</Link>
          <Link href="/transactions" className="p-2 hover:bg-gray-100 rounded-md font-medium text-gray-700">收支记录</Link>
          <Link href="/budgets" className="p-2 hover:bg-gray-100 rounded-md font-medium text-gray-700">预算管理</Link>
          <Link href="/categories" className="p-2 hover:bg-gray-100 rounded-md font-medium text-gray-700">分类管理</Link>
          <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-md font-medium text-gray-700">个人中心</Link>
          <Link href="/guide" className="p-2 hover:bg-gray-100 rounded-md font-medium text-gray-700">使用说明</Link>
        </nav>
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2 truncate">当前用户：{session.user.name}</p>
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}>
            <Button variant="outline" className="w-full">退出登录</Button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}