'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import InputPanel from '@/components/InputPanel';
import ReportViewer from '@/components/ReportViewer';
import ModelSettingsDrawer from '@/components/ModelSettingsDrawer';
import TechniqueLibraryDrawer from '@/components/TechniqueLibraryDrawer';
import {
  addHistory,
  getAllCustomTechniques,
  getSettings,
} from '@/lib/db';
import { PROVIDERS } from '@/lib/constants';
import { extractTitle, genId } from '@/lib/utils';
import type {
  CoordinateId,
  CustomTechnique,
  ModelSettings,
} from '@/lib/types';

export default function HomePage() {
  // 输入状态
  const [idea, setIdea] = useState('');
  const [coordinate, setCoordinate] = useState<CoordinateId>('speculative-depth');
  const [genres, setGenres] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  // 配置与数据
  const [settings, setSettings] = useState<ModelSettings | null>(null);
  const [customTechniques, setCustomTechniques] = useState<CustomTechnique[]>([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // 生成状态
  const [report, setReport] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 抽屉
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [techDrawerOpen, setTechDrawerOpen] = useState(false);

  // 初始化：加载设置与自定义技法
  useEffect(() => {
    (async () => {
      try {
        const [s, t] = await Promise.all([getSettings(), getAllCustomTechniques()]);
        setSettings(s ?? null);
        setCustomTechniques(t);
        // 首次打开且未配置模型：强制弹出设置面板
        if (!s || !s.apiKey || !s.baseUrl || !s.model) {
          setSettingsOpen(true);
        }
      } catch {
        // IndexedDB 不可用（如隐私模式），静默降级
      } finally {
        setSettingsLoaded(true);
      }
    })();
  }, []);

  const refreshTechniques = useCallback(async () => {
    try {
      setCustomTechniques(await getAllCustomTechniques());
    } catch {
      // ignore
    }
  }, []);

  const currentProvider = PROVIDERS.find((p) => p.id === settings?.providerId);
  const visionSupported = currentProvider ? currentProvider.supportsVision : true;

  const handleGenerate = useCallback(async () => {
    if (!idea.trim()) {
      setError('请先输入你的小说构想');
      return;
    }
    if (!settings || !settings.apiKey || !settings.baseUrl || !settings.model) {
      setError('请先在右上角「模型设置」中完成配置');
      setSettingsOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    setReport('');
    setReportTitle('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          coordinate,
          genres,
          imagesBase64:
            visionSupported && images.length > 0 ? images : undefined,
          customTechniques,
          modelConfig: {
            baseUrl: settings.baseUrl,
            model: settings.model,
            apiKey: settings.apiKey,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `生成失败 (${res.status})`);
      }
      if (!data.report) {
        throw new Error('模型未返回有效报告，请重试');
      }

      setReport(data.report);
      const title = extractTitle(data.report);
      setReportTitle(title);

      // 存入历史记录
      try {
        await addHistory({
          id: genId(),
          title,
          idea,
          coordinate,
          genres,
          report: data.report,
          createdAt: Date.now(),
        });
      } catch {
        // 历史写入失败不影响主流程
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [idea, settings, coordinate, genres, images, visionSupported, customTechniques]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ===== 顶部栏 ===== */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-700/60 bg-surface/90 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-wide text-white">
            Story<span className="text-brand">Forge</span>
          </span>
          <span className="hidden text-xs text-slate-500 sm:inline">
            叙事框架锻造 · 思想深度优先
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/history"
            className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:bg-card hover:text-white"
          >
            历史记录
          </Link>
          <button
            onClick={() => setTechDrawerOpen(true)}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:bg-card hover:text-white"
          >
            我的技法库
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            title="模型设置"
            aria-label="模型设置"
            className="rounded-lg p-2 text-slate-300 transition hover:bg-card hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ===== 主体 ===== */}
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 p-5 lg:flex-row">
        {/* 左侧输入区 */}
        <section className="w-full shrink-0 lg:w-1/3 lg:max-w-md">
          <InputPanel
            idea={idea}
            onIdeaChange={setIdea}
            coordinate={coordinate}
            onCoordinateChange={setCoordinate}
            genres={genres}
            onGenresChange={setGenres}
            images={images}
            onImagesChange={setImages}
            visionSupported={visionSupported}
            loading={loading}
            onGenerate={handleGenerate}
          />
        </section>

        {/* 右侧报告区 */}
        <section className="min-w-0 flex-1">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <ReportViewer report={report} title={reportTitle} loading={loading} />
        </section>
      </main>

      {/* ===== 抽屉 ===== */}
      {settingsLoaded && (
        <ModelSettingsDrawer
          open={settingsOpen}
          initial={settings}
          onClose={() => setSettingsOpen(false)}
          onSaved={(s) => {
            setSettings(s);
            setSettingsOpen(false);
          }}
        />
      )}
      <TechniqueLibraryDrawer
        open={techDrawerOpen}
        techniques={customTechniques}
        settings={settings}
        onClose={() => setTechDrawerOpen(false)}
        onChanged={refreshTechniques}
      />
    </div>
  );
}
