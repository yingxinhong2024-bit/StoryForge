'use client';

import { useMemo, useState } from 'react';
import { GENRES } from '@/lib/constants';

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
}

export default function GenreSelector({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, typeof GENRES>();
    for (const g of GENRES) {
      const list = map.get(g.group) ?? [];
      list.push(g);
      map.set(g.group, list);
    }
    return Array.from(map.entries());
  }, []);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-sm font-medium text-slate-300">
          题材（可多选）
        </label>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-indigo-400 hover:text-indigo-300"
        >
          {expanded ? '收起' : '展开全部'}
        </button>
      </div>
      <p className="mb-2 text-xs text-slate-500">
        不选择时由 AI 根据构想自动推荐
      </p>
      <div
        className={`space-y-2 overflow-hidden rounded-lg border border-slate-700/60 bg-card/50 p-3 ${
          expanded ? '' : 'max-h-44 overflow-y-auto'
        }`}
      >
        {groups.map(([group, items]) => (
          <div key={group}>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {group}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map((g) => {
                const active = value.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggle(g.id)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      active
                        ? 'border-brand bg-brand/20 text-indigo-200'
                        : 'border-slate-600 bg-card text-slate-400 hover:border-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {value.length > 0 && (
        <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>已选 {value.length} 个题材</span>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-indigo-400 hover:text-indigo-300"
          >
            清空
          </button>
        </div>
      )}
    </div>
  );
}
