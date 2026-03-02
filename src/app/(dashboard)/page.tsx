import { getDashboardData, getMonthlyTrend } from "@/lib/actions/transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientPieChart } from "./ClientPieChart";
import { ClientLineChart } from "./ClientLineChart";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
type RecentTx = DashboardData["recentTransactions"][number];

export default async function DashboardPage() {
  const [data, trend] = await Promise.all([getDashboardData(), getMonthlyTrend()]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">总览</h1>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">总余额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{data.balance.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">本月收入</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">¥{data.totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">本月支出</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">¥{data.totalExpense.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>本月支出分析</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {data.pieChartData.length > 0 ? (
              <ClientPieChart data={data.pieChartData} />
            ) : (
              <p className="text-gray-500">本月暂无支出</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>最近交易</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {data.recentTransactions.map((t: RecentTx) => (
                  <div key={t.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{t.description || t.category.name}</p>
                      <p className="text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                    <div className={`font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'INCOME' ? '+' : '-'}¥{t.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">暂无交易记录</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>近 6 个月收支趋势</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ClientLineChart data={trend} />
        </CardContent>
      </Card>
    </div>
  );
}