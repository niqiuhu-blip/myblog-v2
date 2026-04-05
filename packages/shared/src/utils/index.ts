// Slug generation
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Reading time calculation (Chinese: ~300 chars/min, English: ~200 words/min)
export function calculateReadingTime(content: string): number {
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = content.split(/\s+/).filter(w => w.length > 0).length;
  const chineseTime = Math.ceil(chineseChars / 300);
  const englishTime = Math.ceil(englishWords / 200);
  return Math.max(1, chineseTime + englishTime);
}

// Pagination helper
export function calculatePagination(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  const safePage = Math.max(1, Math.min(page, totalPages || 1));
  const offset = (safePage - 1) * limit;
  return { page: safePage, limit, offset, totalPages, total };
}

// Date formatting
export function formatDate(date: Date | string, format: 'relative' | 'absolute' = 'absolute'): string {
  const d = new Date(date);
  if (format === 'relative') {
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  }
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
