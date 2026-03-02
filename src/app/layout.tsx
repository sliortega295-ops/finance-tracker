import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "记账助手",
  description: "管理您的收支记录",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
