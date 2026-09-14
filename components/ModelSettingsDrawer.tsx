'use client';

import { useEffect, useState } from 'react';
import { PROVIDERS } from '@/lib/constants';
import { saveSettings } from '@/lib/db';
import type { ModelSettings } from '@/lib/types';

interface Props {
  open: boolean;
  initial: ModelSettings | null;
  onClose: () => void;
  onSaved: (s: ModelSettings) => void;
}

type TestState =
  | { status: 'idle' }
  | { status: 'testing' }
  | { status: 'ok'; message: string }
  | { status: 'fail'; message: string };

export default function ModelSettingsDrawer({
  open,
  initial,
  onClose,
  onSaved,
}: Props) {
  const [providerId, setProviderId] = useState('deepseek');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testState, setTestState] = useState<TestState>({ status: 'idle' });
  const [saving, setSaving] = useState(false);

  // 打开时回填已有配置
  useEffect(() => {
    if (open) {
      if (initial) {
        setProviderId(initial.providerId);
        setBaseUrl(initial.baseUrl);
        setModel(initial.model);
        setApiKey(initial.apiKey);
      } else {
        const p = PROVIDERS[0];
        setProviderId(p.id);
        setBaseUrl(p.baseUrl);
        setModel(p.models[0] ?? '');
        setApiKey('');
      }
      setTestState({ status: 'idle' });
    }
  }, [open, initial]);

  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0];
  const isCustom = provider.id === 'custom';

  const handleProviderChange = (id: string) => {
    const p = PROVIDERS.find((x) => x.id === id);
    if (!p) return;
    setProviderId(id);
    setBaseUrl(p.baseUrl);
    setModel(p.models[0] ?? '');
    setTestState({ status: 'idle' });
  };

  const handleTest = async () => {
    setTestState({ status: 'testing' });
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, model, apiKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setTestState({ status: 'ok', message: data.message || '连接成功' });
      } else {
        setTestState({
          status: 'fail',
          message: data.error || '连接失败',
        });
      }
    } catch {
      setTestState({ status: 'fail', message: '网络错误，无法发起测试' });
    }
  };

  const handleSave = async () => {
    if (!baseUrl.trim() || !model.trim() || !apiKey.trim()) {
      setTestState({
        status: 'fail',
        message: '请完整填写 Base URL、模型名和 API Key',
      });
      return;
    }
    setSaving(true);
    const settings: ModelSettings = {
      providerId,
      baseUrl: baseUrl.trim(),
      model: model.trim(),
      apiKey: apiKey.trim(),
    };
    try {
      await saveSettings(settings);
      onSaved(settings);
    } catch {
      setTestState({
        status: 'fail',
        message: '写入浏览器本地存储失败（可能处于隐私模式）',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const canTest =
    baseUrl.trim() && model.trim() && apiKey.trim() &&
    testState.status !== 'testing';

  return (
    <div className="fixed inset-0 z-50">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* 抽屉 */}
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-slate-700 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <h2 className="text-base font-semibold text-white">模型设置</h2>
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

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <p className="rounded-lg border border-slate-700 bg-surface px-3 py-2.5 text-xs leading-relaxed text-slate-400">
            StoryForge 采用 BYOK 模式：API Key 仅存储在你的浏览器本地，请求时经由本应用服务端转发一次，不会被记录或存储。
          </p>

          {/* 提供商 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              提供商
            </label>
            <select
              value={providerId}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-surface px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-brand"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {provider.docsUrl && (
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-indigo-400 hover:text-indigo-300"
              >
                前往 {provider.name} 开放平台获取 API Key →
              </a>
            )}
          </div>

          {/* Base URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => {
                setBaseUrl(e.target.value);
                setTestState({ status: 'idle' });
              }}
              placeholder={
                isCustom
                  ? 'https://your-endpoint.com/v1'
                  : provider.baseUrl
              }
              className="w-full rounded-lg border border-slate-600 bg-surface px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-brand"
            />
            <p className="mt-1 text-xs text-slate-500">
              兼容任何 OpenAI 格式的 API 端点
            </p>
          </div>

          {/* 模型名 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              模型名
            </label>
            {isCustom ? (
              <input
                type="text"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setTestState({ status: 'idle' });
                }}
                placeholder="例如：my-model-name"
                className="w-full rounded-lg border border-slate-600 bg-surface px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-brand"
              />
            ) : (
              <>
                <input
                  type="text"
                  list="model-options"
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    setTestState({ status: 'idle' });
                  }}
                  placeholder="选择或手动输入模型名"
                  className="w-full rounded-lg border border-slate-600 bg-surface px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-brand"
                />
                <datalist id="model-options">
                  {provider.models.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {provider.models.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setModel(m);
                        setTestState({ status: 'idle' });
                      }}
                      className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                        model === m
                          ? 'border-brand bg-brand/20 text-indigo-200'
                          : 'border-slate-600 text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* API Key */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestState({ status: 'idle' });
                }}
                placeholder="sk-..."
                autoComplete="off"
                className="w-full rounded-lg border border-slate-600 bg-surface px-3 py-2.5 pr-16 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
              >
                {showKey ? '隐藏' : '显示'}
              </button>
            </div>
          </div>

          {/* 测试结果 */}
          {testState.status === 'ok' && (
            <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              {testState.message}
            </p>
          )}
          {testState.status === 'fail' && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {testState.message}
            </p>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-3 border-t border-slate-700 px-5 py-4">
          <button
            type="button"
            onClick={handleTest}
            disabled={!canTest}
            className="flex-1 rounded-lg border border-slate-600 py-2.5 text-sm text-slate-300 transition hover:border-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {testState.status === 'testing' ? '测试中…' : '测试连接'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </aside>
    </div>
  );
}
