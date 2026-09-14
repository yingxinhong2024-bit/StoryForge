'use client';

import { useState } from 'react';
import { TECHNIQUE_CATEGORIES } from '@/lib/constants';
import { addCustomTechnique } from '@/lib/db';
import { genId } from '@/lib/utils';
import type { ModelSettings } from '@/lib/types';

interface Props {
  settings: ModelSettings | null;
  onSaved: () => void;
}

interface ValidationFeedback {
  valid: boolean;
  feedback: string;
  suggestedCategory?: string;
}

export default function CustomTechniqueForm({ settings, onSaved }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(TECHNIQUE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [useCase, setUseCase] = useState('');
  const [combination, setCombination] = useState('');

  const [validating, setValidating] = useState(false);
  const [feedback, setFeedback] = useState<ValidationFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setCategory(TECHNIQUE_CATEGORIES[0]);
    setDescription('');
    setUseCase('');
    setCombination('');
    setFeedback(null);
    setError(null);
  };

  const doSave = async () => {
    await addCustomTechnique({
      id: genId(),
      name: name.trim(),
      category,
      description: description.trim(),
      useCase: useCase.trim(),
      combination: combination
        .split(/[,，、]/)
        .map((s) => s.trim())
        .filter(Boolean),
      createdAt: Date.now(),
    });
    reset();
    onSaved();
  };

  const handleSubmit = async () => {
    setError(null);
    setFeedback(null);

    if (!name.trim() || !description.trim()) {
      setError('技法名称与描述不能为空');
      return;
    }
    if (!settings || !settings.apiKey) {
      setError('请先在「模型设置」中完成配置，校验需要调用模型');
      return;
    }

    setValidating(true);
    try {
      const res = await fetch('/api/validate-technique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technique: {
            name: name.trim(),
            category,
            description: description.trim(),
            useCase: useCase.trim(),
            combination: combination.trim(),
          },
          modelConfig: {
            baseUrl: settings.baseUrl,
            model: settings.model,
            apiKey: settings.apiKey,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || '校验请求失败');
      }
      const result = data.result as ValidationFeedback;
      setFeedback(result);
      if (result.valid) {
        await doSave();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误，请稍后重试');
    } finally {
      setValidating(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-slate-600 bg-surface px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-brand';

  return (
    <div className="rounded-lg border border-slate-700 bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">
        新增自定义技法
      </h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              名称 <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：物的凝视"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
            >
              {TECHNIQUE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">
            描述 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="这条技法是什么、在文本中如何运作"
            rows={2}
            className={`${inputCls} resize-y`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">适用场景</label>
          <input
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            placeholder="什么样的故事/场景适合用它"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">
            推荐搭配（逗号分隔）
          </label>
          <input
            value={combination}
            onChange={(e) => setCombination(e.target.value)}
            placeholder="例如：伏笔与回收, 感官印象"
            className={inputCls}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}
        {feedback && !feedback.valid && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <p>校验未通过：{feedback.feedback}</p>
            {feedback.suggestedCategory && (
              <p className="mt-1">建议分类：{feedback.suggestedCategory}</p>
            )}
            <button
              type="button"
              onClick={doSave}
              className="mt-2 rounded border border-amber-500/50 px-2.5 py-1 text-amber-200 transition hover:bg-amber-500/20"
            >
              仍然保存到技法库
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={validating}
          className="w-full rounded-lg bg-brand py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {validating ? 'AI 校验中…' : '校验并保存'}
        </button>
        <p className="text-[11px] leading-relaxed text-slate-600">
          保存前会调用你配置的模型做一次质量校验（描述清晰度、分类合理性、是否符合「思想深度优先」原则）。通过校验的技法会在生成报告时自动注入上下文。
        </p>
      </div>
    </div>
  );
}
