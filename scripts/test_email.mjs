import { createTransport } from 'nodemailer';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), '.env'), 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#') && l.trim())
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
);

console.log('SMTP 配置:');
console.log('  HOST:', env.SMTP_HOST);
console.log('  PORT:', env.SMTP_PORT);
console.log('  USER:', env.SMTP_USER);
console.log('  PASS:', env.SMTP_PASS ? '已填写' : '未填写');

const transporter = createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: env.SMTP_SECURE === 'true',
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

try {
  await transporter.verify();
  console.log('\n✅ SMTP 连接验证成功，正在发送测试邮件...');
  const info = await transporter.sendMail({
    from: env.SMTP_FROM,
    to: env.SMTP_USER,
    subject: '✅ 记账助手 - 邮件配置测试',
    html: `
      <div style="font-family:sans-serif;padding:24px;max-width:480px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#16a34a;margin-top:0">✅ 邮件配置成功</h2>
        <p>您的 SMTP 邮件配置已验证通过。</p>
        <p>当您的支出超过预算时，系统将自动向此邮箱发送超支提醒。</p>
        <p style="color:#6b7280;font-size:12px;margin-bottom:0">— 记账助手</p>
      </div>
    `,
  });
  console.log('✅ 发送成功！Message ID:', info.messageId);
  console.log('   请检查邮箱：', env.SMTP_USER);
} catch (err) {
  console.error('\n❌ 失败:', err.message);
  if (err.code) console.error('   错误码:', err.code);
}
