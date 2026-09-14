'use client';

import { COORDINATES } from '@/lib/constants';
import type { CoordinateId } from '@/lib/types';

interface Props {
  value: CoordinateId;
  onChange: (id: CoordinateId) => void;
}

export default function CoordinateSelector({ value, onChange }: Props) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-sm font-medium text-slate-300">文学坐标</label>
        <span className="text-xs text-slate-500">四选一 · 不含纯爽文取向</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {COORDINATES.map((c) => {
          const active = c.id === value;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={`rounded-lg border p-3 text-left transition ${
                active
                  ? 'border-brand bg-brand/15 shadow-[0_0_0_1px_#6366f1]'
                  : 'border-slate-700 bg-card hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-semibold ${
                    active ? 'text-indigo-300' : 'text-slate-200'
                  }`}
                >
                  {c.name}
                </span>
                {active && (
                  <span className="h-2 w-2 rounded-full bg-brand" />
                )}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">{c.layer}</div>
              <div className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                {c.coreLogic}
              </div>
              <div className="mt-1.5 text-[11px] text-slate-600">
                对标：{c.representativeWorks.slice(0, 3).join('、')}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
