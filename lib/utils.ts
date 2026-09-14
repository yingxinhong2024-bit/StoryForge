// ===== 通用小工具 =====

/** 从 Markdown 报告中提取作品暂定名：# 《xxx》创作分析报告 */
export function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s*《(.+?)》/m);
  if (match && match[1]) return match[1].trim();
  const h1 = markdown.match(/^#\s+(.+)$/m);
  if (h1 && h1[1]) return h1[1].trim().slice(0, 30);
  return '未命名报告';
}

/** 生成 PDF 文件名：StoryForge_[作品名]_[日期].pdf */
export function buildPdfFilename(title: string): string {
  const safe = title.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40);
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate()
  ).padStart(2, '0')}`;
  return `StoryForge_${safe}_${date}.pdf`;
}

/** 时间戳 → 可读字符串 */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** 生成 UUID（带降级） */
export function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
