import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendBudgetExceededEmail({
  to,
  userName,
  categoryName,
  budgetAmount,
  spentAmount,
}: {
  to: string;
  userName: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
}) {
  const overAmount = spentAmount - budgetAmount;
  const percent = ((spentAmount / budgetAmount) * 100).toFixed(1);

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `⚠️ 预算超支提醒：${categoryName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #dc2626; margin-top: 0;">预算超支提醒</h2>
        <p>您好，<strong>${userName}</strong>，</p>
        <p>您的 <strong>「${categoryName}」</strong> 分类本月已超出预算：</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #f9fafb;">
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">月度预算</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold;">¥${budgetAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">已花费</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold; color: #dc2626;">¥${spentAmount.toFixed(2)}</td>
          </tr>
          <tr style="background: #fef2f2;">
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">超出金额</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold; color: #dc2626;">¥${overAmount.toFixed(2)}（已达预算的 ${percent}%）</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 14px;">请注意控制支出，合理规划您的财务。</p>
        <p style="color: #6b7280; font-size: 12px; margin-bottom: 0;">— 记账助手</p>
      </div>
    `,
  });
}
