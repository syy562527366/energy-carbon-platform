import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '能碳管理平台 - 能耗查询',
  description: '工业企业和园区数字化能碳管理中心',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
