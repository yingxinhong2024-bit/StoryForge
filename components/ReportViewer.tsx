'use client';

import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidBlock from './MermaidBlock';
import { buildPdfFilename, extractTitle } from '@/lib/utils';

interface Props {
  report: string;
  title: string;
  loading: boolean;
}

export default function ReportViewer({ report, title, loading }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPdf = async () => {
    if (!reportRef.current || exporting) return;
    setExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const finalTitle = title || extractTitle(report);
      await html2pdf()
        .set({
          margin: [12, 12, 12, 12],
          filename: buildPdfFilename(finalTitle),
          image: { type: 'jpeg', quality: 0.95 },
          enableLinks: false,
          html2canvas: {
            scale: 2,
            backgroundColor: '#0f172a',
            useCORS: true,
            logging: false,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(reportRef.current)
        .save();
    } catch {
      alert('PDF 导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  // ===== 空状态 =====
  if (!report && !loading) {
    return (
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-700 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-12 w-12 text-slate-700"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        <div>
          <p className="text-sm text-slate-400">
            在左侧输入你的小说构想，选择文学坐标，点击「生成创作分析报告」
          </p>
          <p className="mt-1 text-xs text-slate-600">
            报告将涵盖故事架构、人物关系图、命名方案、技法组合与思想内核
          </p>
        </div>
      </div>
    );
  }

  // ===== 加载状态 =====
  if (loading) {
    return (
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center gap-4 rounded-xl border border-slate-700/60 bg-card">
        <svg
          className="h-10 w-10 animate-spin text-brand"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <div className="text-center">
          <p className="text-sm text-slate-300">AI 正在分析你的构想…</p>
          <p className="mt-1 text-xs text-slate-500">
            正在构建十节结构化报告：架构 · 人物 · 命名 · 技法 · 思想内核
          </p>
        </div>
      </div>
    );
  }

  // ===== 报告渲染 =====
  return (
    <div className="rounded-xl border border-slate-700/60 bg-card">
      {/* 工具栏 */}
      <div className="sticky top-[57px] z-20 flex items-center justify-between rounded-t-xl border-b border-slate-700/60 bg-card/95 px-5 py-3 backdrop-blur">
        <div className="min-w-0">
          <span className="text-sm font-medium text-slate-300">报告预览</span>
          {title && (
            <span className="ml-2 truncate text-sm text-indigo-300">
              《{title}》
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={exporting}
          className="shrink-0 rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {exporting ? '导出中…' : '下载 PDF'}
        </button>
      </div>

      {/* Markdown 内容（PDF 导出区域） */}
      <div ref={reportRef} className="bg-card px-6 py-6 sm:px-8">
        <article className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code(props) {
                const { className, children, ...rest } = props as {
                  className?: string;
                  children?: React.ReactNode;
                };
                const match = /language-(\w+)/.exec(className || '');
                if (match && match[1] === 'mermaid') {
                  return <MermaidBlock code={String(children ?? '')} />;
                }
                return (
                  <code className={className} {...rest}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {report}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
