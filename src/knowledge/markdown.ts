export type KnowledgeFrontmatter = {
  title?: string;
  description?: string;
  status?: string;
  order?: number;
};

export type ParsedMarkdown = {
  frontmatter: KnowledgeFrontmatter;
  body: string;
};

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseFrontmatterBlock(block: string): KnowledgeFrontmatter {
  const result: KnowledgeFrontmatter = {};
  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf(':');
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const raw = unquote(trimmed.slice(separator + 1).trim());
    if (key === 'title' && raw) {
      result.title = raw;
    } else if (key === 'description' && raw) {
      result.description = raw;
    } else if (key === 'status' && raw) {
      result.status = raw;
    } else if (key === 'order' && raw) {
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed)) {
        result.order = parsed;
      }
    }
  }
  return result;
}

export function parseMarkdownDocument(raw: string): ParsedMarkdown {
  const match = FRONTMATTER_PATTERN.exec(raw);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }
  return {
    frontmatter: parseFrontmatterBlock(match[1] ?? ''),
    body: raw.slice(match[0].length),
  };
}

export function firstHeading(markdown: string): string | undefined {
  for (const line of markdown.split('\n')) {
    const match = /^#\s+(.+?)\s*$/.exec(line);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

export function titleFromFilename(fileName: string): string {
  const base = fileName.replace(/\.md$/i, '');
  const adr = /^ADR-(\d+)-(.+)$/i.exec(base);
  if (adr) {
    return `ADR-${adr[1]}: ${readableWords(adr[2] ?? '')}`;
  }
  const phase = /^phase-(\d+)-(.+)$/i.exec(base);
  if (phase) {
    const number = phase[1] ?? '';
    return `Phase ${number}: ${readableWords(phase[2] ?? '')}`;
  }
  if (base.toLowerCase() === 'readme') {
    return 'Overview';
  }
  return readableWords(base);
}

function readableWords(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function deriveTitle(
  frontmatter: KnowledgeFrontmatter,
  body: string,
  fileName: string,
): string {
  if (frontmatter.title?.trim()) {
    return frontmatter.title.trim();
  }
  return firstHeading(body) ?? titleFromFilename(fileName);
}

export function stripMatchingTitleHeading(markdown: string, title: string): string {
  const match = /^(#\s+(.+?)\s*(?:\r?\n)+)/.exec(markdown);
  if (!match) {
    return markdown;
  }
  const heading = match[2]?.trim();
  if (heading === title) {
    return markdown.slice(match[0].length);
  }
  return markdown;
}
