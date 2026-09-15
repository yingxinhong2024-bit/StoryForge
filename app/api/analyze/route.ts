import { NextRequest } from 'next/server';
import { buildSystemPrompt, buildUserText } from '@/lib/prompts';
import type { CoordinateId, CustomTechnique } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface AnalyzeBody {
  idea: string;
  coordinate: CoordinateId;
  genres: string[];
  /** 多张参考图（优先） */
  imagesBase64?: string[];
  /** 单张参考图（向后兼容） */
  imageBase64?: string;
  customTechniques?: CustomTechnique[];
  modelConfig: {
    baseUrl: string;
    model: string;
    apiKey: string;
  };
}

type MessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    >;

export async function POST(req: NextRequest) {
  let body: AnalyzeBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: '请求体格式错误' }, { status: 400 });
  }

  const { idea, coordinate, genres = [], imagesBase64, imageBase64, customTechniques = [], modelConfig } = body;

  if (!idea || !idea.trim()) {
    return Response.json({ error: '构想内容不能为空' }, { status: 400 });
  }
  if (!modelConfig || !modelConfig.baseUrl || !modelConfig.model || !modelConfig.apiKey) {
    return Response.json(
      { error: '模型配置不完整，请先在「模型设置」中填写 Base URL、模型名和 API Key' },
      { status: 400 }
    );
  }

  const { baseUrl, model, apiKey } = modelConfig;

  let systemPrompt: string;
  try {
    systemPrompt = buildSystemPrompt({ coordinateId: coordinate, genreIds: genres, customTechniques });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Prompt 构建失败' },
      { status: 400 }
    );
  }

  // 归一化图片列表：优先 imagesBase64，兼容单图 imageBase64，最多 4 张
  const images = (
    Array.isArray(imagesBase64) && imagesBase64.length > 0
      ? imagesBase64
      : imageBase64
        ? [imageBase64]
        : []
  )
    .filter((u): u is string => typeof u === 'string' && u.startsWith('data:image/'))
    .slice(0, 4);

  const userText = buildUserText(idea, coordinate, genres, images.length);

  let userContent: MessageContent = userText;
  if (images.length > 0) {
    userContent = [
      { type: 'text', text: userText },
      ...images.map((url) => ({
        type: 'image_url' as const,
        image_url: { url },
      })),
    ];
  }

  const requestBody = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.8,
    // 不设置 response_format：输出为 Markdown 文本
  };

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
  } catch {
    return Response.json(
      { error: '无法连接到模型服务，请检查 Base URL 是否正确、网络是否通畅' },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    let hint = '';
    if (upstream.status === 401) hint = '（API Key 可能无效或已过期）';
    else if (upstream.status === 404) hint = '（接口路径或模型名可能不正确）';
    else if (upstream.status === 429) hint = '（请求频率超限或额度不足）';
    return Response.json(
      {
        error: `模型服务返回错误 ${upstream.status}${hint}：${errText.slice(0, 300)}`,
      },
      { status: 502 }
    );
  }

  let data: {
    choices?: Array<{ message?: { content?: string } }>;
  };
  try {
    data = await upstream.json();
  } catch {
    return Response.json(
      { error: '模型服务返回了无法解析的响应' },
      { status: 502 }
    );
  }

  const report = data.choices?.[0]?.message?.content;
  if (!report || typeof report !== 'string') {
    return Response.json(
      { error: '模型未返回有效内容，请重试或更换模型' },
      { status: 502 }
    );
  }

  // 注意：apiKey 仅用于上方 Authorization 头，不写入任何日志与持久化存储。
  return Response.json({ report });
}
