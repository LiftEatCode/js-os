import type { KnowledgeDocument, KnowledgeSearchHit } from './types.ts';

function normalize(value: string): string {
  return value.toLowerCase();
}

function excerptAround(content: string, query: string): string | undefined {
  const lower = content.toLowerCase();
  const index = lower.indexOf(query.toLowerCase());
  if (index === -1) {
    return undefined;
  }
  const start = Math.max(0, index - 40);
  const end = Math.min(content.length, index + query.length + 80);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < content.length ? '…' : '';
  return `${prefix}${content.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`;
}

export function searchKnowledgeDocuments(
  documents: readonly KnowledgeDocument[],
  rawQuery: string,
): KnowledgeSearchHit[] {
  const query = rawQuery.trim();
  if (query.length === 0) {
    return [];
  }
  const needle = normalize(query);
  const hits: KnowledgeSearchHit[] = [];

  for (const document of documents) {
    const haystack = [
      document.title,
      document.section,
      document.sectionLabel,
      document.relativePath,
      document.content,
    ]
      .join('\n')
      .toLowerCase();
    if (!haystack.includes(needle)) {
      continue;
    }
    hits.push({
      slug: document.slug,
      title: document.title,
      section: document.section,
      sectionLabel: document.sectionLabel,
      relativePath: document.relativePath,
      excerpt: excerptAround(document.content, query) ?? excerptAround(document.title, query),
    });
  }

  return hits.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
}
