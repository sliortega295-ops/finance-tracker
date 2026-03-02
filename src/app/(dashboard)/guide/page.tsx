import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    step: "01",
    title: "注册 / 登录",
    color: "bg-blue-50 border-blue-200",
    titleColor: "text-blue-700",
    items: [
      "首次使用请点击「立即注册」，填写姓名、邮箱和密码完成注册。",
      "注册成功后系统会自动帮您创建「工资、餐饮、交通、住房」四个默认分类。",
      "已有账户直接在登录页输入邮箱和密码登录。",
    ],
  },
  {
    step: "02",
    title: "管理分类",
    color: "bg-indigo-50 border-indigo-200",
    titleColor: "text-indigo-700",
    badge: "先做这步",
    items: [
      "进入「分类管理」页面，可以查看所有支出和收入分类。",
      "点击卡片右上角「新建分类」可以自由添加分类，分为支出和收入两种类型。",
      "分类名称在同类型下不能重复，最多 20 个字符。",
      "有关联交易记录的分类无法删除，需先删除相关记录。",
      "在「添加记录」弹窗的分类选择旁也有「管理分类」快捷入口。",
    ],
  },
  {
    step: "03",
    title: "记录收支",
    color: "bg-green-50 border-green-200",
    titleColor: "text-green-700",
    items: [
      "进入「收支记录」页面，点击右上角「添加记录」按钮。",
      "选择类型（收入 / 支出）、填写金额、选择日期和分类，备注可选填。",
      "每条记录右侧有 ✏️ 编辑 和 🗑 删除 按钮，删除前会弹出确认对话框。",
      "点击 ✏️ 编辑可修改该记录的所有字段。",
      "记录保存后会立即反映在「总览」页的统计数据中。",
    ],
  },
  {
    step: "04",
    title: "设置预算",
    color: "bg-yellow-50 border-yellow-200",
    titleColor: "text-yellow-700",
    items: [
      "进入「预算管理」页面，点击右上角「设置预算」按钮。",
      "为每个支出分类设置本月的花费上限金额。",
      "每个预算卡片右上角有 ✏️ 编辑按钮，可随时调整金额；也可 🗑 删除整条预算。",
      "进度条颜色含义：绿色（正常）→ 黄色（已超 80%，注意控制）→ 红色（已超支）。",
      "预算按月计算，每月初自动重置，历史数据仍保留。",
    ],
  },
  {
    step: "05",
    title: "超支邮件提醒",
    color: "bg-red-50 border-red-200",
    titleColor: "text-red-700",
    badge: "自动触发",
    items: [
      "每次添加支出记录后，系统会自动检查该分类是否超出预算。",
      "一旦累计花费超过预算上限，系统立即向您的注册邮箱发送提醒邮件。",
      "邮件内容包含：预算金额、已花费金额、超出金额及超出百分比。",
      "邮件发送至您注册时填写的邮箱，可在「个人中心」查看当前邮箱地址。",
    ],
  },
  {
    step: "06",
    title: "个人中心",
    color: "bg-purple-50 border-purple-200",
    titleColor: "text-purple-700",
    items: [
      "顶部卡片展示您的头像（姓名首字母）、邮箱、注册日期和已使用天数。",
      "「账户统计」区域展示累计记录笔数、本月收支金额、分类数量，实时刷新。",
      "「数据导出」可将全部收支记录导出为 CSV 文件，支持 Excel 直接打开（中文不乱码）。",
      "「基本信息」可修改您的显示姓名。",
      "「修改密码」需先验证当前密码，新密码至少 6 位。",
    ],
  },
];

const faqs = [
  {
    q: "为什么收到了超支提醒邮件？",
    a: "因为您在该分类本月的累计支出已超过您设置的预算上限。建议进入「预算管理」页面查看各分类的详细进度。",
  },
  {
    q: "没有收到超支提醒邮件怎么办？",
    a: "请检查垃圾邮件文件夹；确认「个人中心」中的邮箱地址正确；同时确保该分类已在「预算管理」中设置了预算上限。",
  },
  {
    q: "如何添加新的收支分类？",
    a: "进入「分类管理」页面，点击「新建分类」按钮，输入名称并选择支出或收入类型即可。分类创建后可在添加记录时立即使用。",
  },
  {
    q: "分类删除不了怎么办？",
    a: "有关联交易记录的分类无法直接删除。请先进入「收支记录」页面，删除该分类下的所有记录，再回来删除分类。",
  },
  {
    q: "历史月份的数据在哪里查看？",
    a: "「收支记录」页面展示所有历史记录，按日期倒序排列。「总览」页仅展示本月数据，个人中心的统计数据也均为本月。",
  },
  {
    q: "如何导出数据？",
    a: "进入「个人中心」，在「数据导出」区域点击「下载 CSV」，会自动下载包含全部历史记录的文件，可用 Excel 或 Numbers 打开。",
  },
];

export default function GuidePage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">使用说明</h1>
        <p className="text-gray-500 mt-1">快速了解记账助手的各项功能</p>
      </div>

      {/* 步骤说明 */}
      <div className="space-y-4">
        {steps.map(({ step, title, color, titleColor, badge, items }) => (
          <Card key={step} className={`border ${color}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`flex items-center gap-3 text-lg ${titleColor}`}>
                <span className="text-2xl font-black opacity-40">{step}</span>
                {title}
                {badge && (
                  <Badge variant="secondary" className="ml-1 text-xs">{badge}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="mt-0.5 shrink-0 text-gray-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 常见问题 */}
      <div>
        <h2 className="text-xl font-bold mb-4">常见问题</h2>
        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <p className="font-medium text-gray-800 mb-1">Q：{q}</p>
                <p className="text-sm text-gray-600">A：{a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 功能速查 */}
      <div>
        <h2 className="text-xl font-bold mb-4">功能速查</h2>
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {[
                ["📊", "总览", "本月收支统计、饼图、近期记录"],
                ["📝", "收支记录", "添加、编辑、删除收支记录"],
                ["💰", "预算管理", "设置、编辑、删除月度预算"],
                ["🏷️", "分类管理", "新建、删除支出 / 收入分类"],
                ["👤", "个人中心", "账户统计、数据导出、改名、改密码"],
                ["📖", "使用说明", "功能介绍与常见问题"],
              ].map(([icon, name, desc]) => (
                <div key={name} className="flex items-start gap-2 py-1.5 border-b last:border-0 sm:last:border-0">
                  <span className="text-base">{icon}</span>
                  <div>
                    <span className="font-medium text-gray-800">{name}</span>
                    <span className="text-gray-400 ml-2">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 提示卡片 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800">
            💡 <strong>小贴士：</strong>养成每天记录收支的习惯，配合预算功能，可以帮助您清晰掌握资金流向，避免月底超支。数据随时可通过「个人中心」导出备份。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
