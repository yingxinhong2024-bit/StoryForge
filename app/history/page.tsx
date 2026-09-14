'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import HistoryList from '@/components/HistoryList';
import ReportViewer from '@/components/ReportViewer';
import { getAllHistory } from '@/lib/db';
import type { HistoryRecord } from '@/lib/types';

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [selected, setSelected] = useState<HistoryRecord | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setRecords(await getAllHistory());
      } catch {
        // IndexedDB 不可用时显示空列表
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-700/60 bg-surface/90 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-bold tracking-wide text-white">
            Story<span className="text-brand">Forge</span>
          </Link>
          <span className="text-xs text-slate-500">历史记录</span>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          返回创作
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 p-5 lg:flex-row">
        <section className="w-full shrink-0 lg:w-1/3 lg:max-w-md">
          {loaded ? (
            <HistoryList
              records={records}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              onDeleted={(id) => {
                setRecords((prev) => prev.filter((r) => r.id !== id));
                if (selected?.id === id) setSelected(null);
              }}
            />
          ) : (
            <div className="rounded-xl border border-slate-700/60 bg-card p-6 text-center text-sm text-slate-500">
              加载中…
            </div>
          )}
        </section>

        <section className="min-w-0 flex-1">
          {selected ? (
            <ReportViewer
              report={selected.report}
              title={selected.title}
              loading={false}
            />
          ) : (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
              从左侧选择一条历史记录查看报告，可重新导出 PDF
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
