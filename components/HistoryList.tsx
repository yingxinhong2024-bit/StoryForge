'use client';

import { COORDINATES } from '@/lib/constants';
import { deleteHistory } from '@/lib/db';
import { formatTime } from '@/lib/utils';
import type { HistoryRecord } from '@/lib/types';

interface Props {
  records: HistoryRecord[];
  selectedId: string | null;
  onSelect: (r: HistoryRecord) => void;
  onDeleted: (id: string) => void;
}

export default function HistoryList({
  records,
  selectedId,
  onSelect,
  onDeleted,
}: Props) {
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('确定删除这条历史报告吗？删除后不可恢复。')) return;
    try {
      await deleteHistory(id);
      onDeleted(id);
    } catch {
      alert('删除失败');
    }
  };

  const coordinateName = (id: string) =>
    COORDINATES.find((c) => c.id === id)?.name ?? id;

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/60 bg-card p-8 text-center">
        <p className="text-sm text-slate-400">暂无历史记录</p>
        <p className="mt-1 text-xs text-slate-600">
          每次生成的报告都会自动保存在浏览器本地
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {records.map((r) => {
        const active = r.id === selectedId;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r)}
            className={`w-full rounded-xl border p-4 text-left transition ${
              active
                ? 'border-brand bg-brand/10'
                : 'border-slate-700/60 bg-card hover:border-slate-500'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div
                  className={`truncate text-sm font-semibold ${
                    active ? 'text-indigo-200' : 'text-slate-200'
                  }`}
                >
                  《{r.title}》
                </div>
                <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                  {r.idea}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] text-indigo-300">
                    {coordinateName(r.coordinate)}
                  </span>
                  <span className="text-[11px] text-slate-600">
                    {formatTime(r.createdAt)}
                  </span>
                </div>
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => handleDelete(e, r.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleDelete(e as unknown as React.MouseEvent, r.id);
                }}
                className="shrink-0 rounded px-2 py-1 text-xs text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
              >
                删除
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
