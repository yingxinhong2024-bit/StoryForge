'use client';

import CustomTechniqueForm from './CustomTechniqueForm';
import { deleteCustomTechnique } from '@/lib/db';
import { formatTime } from '@/lib/utils';
import type { CustomTechnique, ModelSettings } from '@/lib/types';

interface Props {
  open: boolean;
  techniques: CustomTechnique[];
  settings: ModelSettings | null;
  onClose: () => void;
  onChanged: () => void;
}

export default function TechniqueLibraryDrawer({
  open,
  techniques,
  settings,
  onClose,
  onChanged,
}: Props) {
  if (!open) return null;

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条自定义技法吗？')) return;
    try {
      await deleteCustomTechnique(id);
      onChanged();
    } catch {
      alert('删除失败');
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* 底部抽屉 */}
      <aside className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[85vh] w-full max-w-3xl flex-col rounded-t-2xl border-t border-slate-700 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">我的技法库</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              自定义技法会在生成报告时自动注入 AI 上下文
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-surface hover:text-white"
            aria-label="关闭"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {/* 技法列表 */}
          {techniques.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              还没有自定义技法。在下方表单中添加你的第一条创作技法。
            </p>
          ) : (
            <div className="space-y-2.5">
              {techniques.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-slate-700 bg-surface p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200">
                          {t.name}
                        </span>
                        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] text-indigo-300">
                          {t.category}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {t.description}
                      </p>
                      {t.useCase && (
                        <p className="mt-1 text-xs text-slate-500">
                          适用：{t.useCase}
                        </p>
                      )}
                      {t.combination.length > 0 && (
                        <p className="mt-1 text-xs text-slate-500">
                          搭配：{t.combination.join('、')}
                        </p>
                      )}
                      <p className="mt-1.5 text-[11px] text-slate-600">
                        添加于 {formatTime(t.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="shrink-0 rounded px-2 py-1 text-xs text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 新增表单 */}
          <CustomTechniqueForm settings={settings} onSaved={onChanged} />
        </div>
      </aside>
    </div>
  );
}
