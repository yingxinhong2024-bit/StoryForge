'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  code: string;
}

export default function MermaidBlock({ code }: Props) {
  const [svg, setSvg] = useState<string>('');
  const [failed, setFailed] = useState(false);
  const idRef = useRef(`mmd-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'system-ui, sans-serif',
        });
        const { svg: rendered } = await mermaid.render(
          idRef.current,
          code.trim()
        );
        if (!cancelled) setSvg(rendered);
      } catch {
        // 渲染失败兜底：展示原始代码而不是崩溃
        if (!cancelled) setFailed(true);
        // 清理 mermaid 失败时可能注入 DOM 的错误节点
        const errNode = document.getElementById(idRef.current);
        if (errNode) errNode.remove();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (failed) {
    return (
      <div className="my-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
        <p className="mb-2 text-xs text-amber-400">
          Mermaid 图渲染失败（语法可能有误），以下为原始代码：
        </p>
        <pre className="overflow-x-auto text-xs text-slate-400">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="mermaid-wrapper">
        <span className="text-xs text-slate-500">关系图渲染中…</span>
      </div>
    );
  }

  return (
    <div
      className="mermaid-wrapper"
      // mermaid.render 返回可信的 SVG 字符串
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
