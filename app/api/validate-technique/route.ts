import { NextRequest } from 'next/server';
import { buildTechniqueValidationPrompt } from '@/lib/prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ValidateBody {
  technique: {
    name: string;
    category: string;
    description: string;
    useCase: string;
    combination: string;
  };
  modelConfig: {
    baseUrl: string;
    model: string;
    apiKey: string;
  };
}

interface ValidationResult {
  valid: boolean;
  feedback: string;
  suggestedCategory?: string;
}

export async function POST(req: NextRequest) {
  let body: ValidateBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: '请求体格式错误' }, { status: 400 });
  }

  const { technique, modelConfig } = body;
  if (!technique || !technique.name || !technique.description) {
    return Response.json({ error: '技法名称与描述不能为空' }, { status: 400 });
  }
  if (!modelConfig || !modelConfig.baseUrl || !modelConfig.model || !modelConfig.apiKey) {
    return Response.json(
      { error: '模型配置不完整，请先在「模型设置」中完成配置' },
      { status: 400 }
    );
  }

  const { baseUrl, model, apiKey } = modelConfig;
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'user', content: buildTechniqueValidationPrompt(technique) },
        ],
        temperature: 0.2,
      }),
    });
  } catch {
    return Response.json(
      { error: '无法连接到模型服务，请检查模型设置' },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    return Response.json(
      { error: `模型服务返回错误 ${upstream.status}，请检查模型设置` },
      { status: 502 }
    );
  }

  const data = await upstream.json().catch(() => null);
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    return Response.json({ error: '模型未返回有效校验结果' }, { status: 502 });
  }

  // 从模型输出中提取 JSON（容错：可能包裹在代码块中）
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return Response.json({
      result: {
        valid: true,
        feedback: '模型未返回结构化结论，已默认通过。请人工确认描述清晰后再使用。',
      } satisfies ValidationResult,
    });
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as ValidationResult;
    return Response.json({
      result: {
        valid: Boolean(parsed.valid),
        feedback: typeof parsed.feedback === 'string' ? parsed.feedback : '无反馈',
        suggestedCategory:
          typeof parsed.suggestedCategory === 'string'
            ? parsed.suggestedCategory
            : '',
      } satisfies ValidationResult,
    });
  } catch {
    return Response.json({
      result: {
        valid: true,
        feedback: '校验结果解析失败，已默认通过。请人工确认描述清晰后再使用。',
      } satisfies ValidationResult,
    });
  }
}
