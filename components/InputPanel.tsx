'use client';

import { useRef } from 'react';
import CoordinateSelector from './CoordinateSelector';
import GenreSelector from './GenreSelector';
import { SAMPLE_IDEAS } from '@/lib/constants';
import type { CoordinateId } from '@/lib/types';

interface Props {
  idea: string;
  onIdeaChange: (v: string) => void;
  coordinate: CoordinateId;
  onCoordinateChange: (v: CoordinateId) => void;
  genres: string[];
  onGenresChange: (v: string[]) => void;
  images: string[];
  onImagesChange: (v: string[]) => void;
  visionSupported: boolean;
  loading: boolean;
  onGenerate: () => void;
}

const MAX_IMAGES = 4;
const MAX_FILE_SIZE = 4 * 1024 * 1024;

export default function InputPanel({
  idea,
  onIdeaChange,
  coordinate,
  onCoordinateChange,
  genres,
  onGenresChange,
  images,
  onImagesChange,
  visionSupported,
  loading,
  onGenerate,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    const picked = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remaining);
    // FileReader 是异步回调，用闭包累加器保证多文件依次追加
    let acc = [...images];
    for (const file of picked) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`「${file.name}」超过 4MB，已跳过`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          acc = [...acc, reader.result];
          onImagesChange(acc);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const applySample = (index: number) => {
    const s = SAMPLE_IDEAS[index];
    if (!s) return;
    onIdeaChange(s.idea);
    onCoordinateChange(s.coordinate);
    onGenresChange(s.genres);
  };

  return (
    <div className="space-y-5 rounded-xl border border-slate-700/60 bg-card p-5">
      {/* 构想输入 */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <label className="text-sm font-medium text-slate-300">
            小说构想 <span className="text-red-400">*</span>
          </label>
          <span className="text-xs text-slate-500">
            {idea.length > 0 ? `${idea.length} 字` : ''}
          </span>
        </div>
        <textarea
          value={idea}
          onChange={(e) => onIdeaChange(e.target.value)}
          placeholder="用自然语言描述你的构想：可以是一个设定、一个人物、一个场景、一个萦绕不去的问题……"
          rows={8}
          className="w-full resize-y rounded-lg border border-slate-600 bg-surface px-3 py-2.5 text-sm leading-relaxed text-slate-200 placeholder-slate-600 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
        />
        {/* 示例构想 */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500">试试示例：</span>
          {SAMPLE_IDEAS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onClick={() => applySample(i)}
              className="rounded-full border border-slate-600 px-2.5 py-0.5 text-xs text-slate-400 transition hover:border-brand hover:text-indigo-300"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 文学坐标 */}
      <CoordinateSelector value={coordinate} onChange={onCoordinateChange} />

      {/* 题材多选 */}
      <GenreSelector value={genres} onChange={onGenresChange} />

      {/* 图片上传（最多 MAX_IMAGES 张） */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <label className="text-sm font-medium text-slate-300">
            参考图（可选）
          </label>
          {images.length > 0 && (
            <span className="text-xs text-slate-500">
              {images.length}/{MAX_IMAGES} 张
            </span>
          )}
        </div>

        {images.length > 0 && (
          <div className="mb-2 grid grid-cols-2 gap-2">
            {images.map((img, i) => (
              <div key={i} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`参考图 ${i + 1}`}
                  className="h-24 w-full rounded-lg border border-slate-600 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label={`移除参考图 ${i + 1}`}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
                >
                  移除
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-600 py-4 text-sm text-slate-500 transition hover:border-slate-400 hover:text-slate-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            {images.length === 0
              ? '上传情绪板 / 手写笔记照片'
              : '继续添加参考图'}
          </button>
        )}

        {images.length > 0 && !visionSupported && (
          <p className="mt-1.5 text-xs text-amber-400">
            当前配置的模型可能不支持视觉输入，生成时将跳过所有图片。
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
            }
            e.target.value = '';
          }}
        />
      </div>

      {/* 生成按钮 */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={loading || !idea.trim()}
        className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
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
            正在锻造叙事框架…（长报告需 30-120 秒）
          </span>
        ) : (
          '生成创作分析报告'
        )}
      </button>
    </div>
  );
}
