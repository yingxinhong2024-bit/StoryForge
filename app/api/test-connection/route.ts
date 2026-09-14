import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface TestBody {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export async function POST(req: NextRequest) {
  let body: TestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: '请求体格式错误' }, { status: 400 });
  }

  const { baseUrl, model, apiKey } = body;
  if (!baseUrl || !model || !apiKey) {
    return Response.json(
      { ok: false, error: '请完整填写 Base URL、模型名和 API Key' },
      { status: 400 }
    );
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      let hint = '';
      if (upstream.status === 401) hint = '：API Key 无效或已过期';
      else if (upstream.status === 404) hint = '：接口路径或模型名不正确';
      else if (upstream.status === 429) hint = '：额度不足或频率超限';
      return Response.json({
        ok: false,
        error: `连接失败 (${upstream.status})${hint}。${errText.slice(0, 200)}`,
      });
    }

    const data = await upstream.json().catch(() => null);
    if (data && Array.isArray(data.choices)) {
      return Response.json({ ok: true, message: `连接成功，模型 ${model} 可用` });
    }
    return Response.json({
      ok: false,
      error: '服务可达，但响应格式不符合 OpenAI 规范',
    });
  } catch {
    return Response.json({
      ok: false,
      error: '无法连接到该 Base URL，请检查地址与网络',
    });
  }
}
