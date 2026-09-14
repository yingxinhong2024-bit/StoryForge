import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StoryForge - AI 小说叙事框架锻造工具',
  description:
    '输入一段构想，获得跨文学坐标的叙事框架分析报告：故事架构、人物关系、命名方案、技法组合、思想内核。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-surface text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
