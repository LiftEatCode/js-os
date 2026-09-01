import path from 'node:path';
import { LANDING_INDEX_PATH } from './constants.ts';
import { knowledgeHrefForSlug, landingHref, relativePathToSlug, toPosixPath } from './paths.ts';
import type { KnowledgeHrefRewrite } from './types.ts';

const PROTOCOL_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

function splitHash(href: string): { pathPart: string; hash?: string } {
  const hashIndex = href.indexOf('#');
  if (hashIndex === -1) {
    return { pathPart: href };
  }
  return {
    pathPart: href.slice(0, hashIndex),
    hash: href.slice(hashIndex + 1),
  };
}

function isExternalHref(href: string): boolean {
  return PROTOCOL_PATTERN.test(href) || href.startsWith('//');
}

export function rewriteDocsHref(href: string, fromRelativePath: string): KnowledgeHrefRewrite {
  const trimmed = href.trim();
  if (trimmed.length === 0) {
    return { kind: 'other', href };
  }
  if (trimmed.startsWith('#')) {
    return { kind: 'anchor', href: trimmed };
  }
  if (isExternalHref(trimmed)) {
    return { kind: 'external', href: trimmed };
  }

  const { pathPart, hash } = splitHash(trimmed);
  if (pathPart.length === 0 && hash !== undefined) {
    return { kind: 'anchor', href: `#${hash}` };
  }

  let decoded = pathPart;
  try {
    decoded = decodeURIComponent(pathPart);
  } catch {
    return { kind: 'other', href };
  }

  const fromDir = path.posix.dirname(toPosixPath(fromRelativePath));
  const resolved = path.posix.normalize(path.posix.join(fromDir, decoded));
  if (resolved.startsWith('../') || resolved === '..' || path.posix.isAbsolute(resolved)) {
    return { kind: 'other', href };
  }

  if (!resolved.toLowerCase().endsWith('.md')) {
    return { kind: 'other', href };
  }

  if (resolved === LANDING_INDEX_PATH) {
    return { kind: 'knowledge', href: landingHref(hash) };
  }

  const slug = relativePathToSlug(resolved);
  if (!slug) {
    return { kind: 'other', href };
  }
  return { kind: 'knowledge', href: knowledgeHrefForSlug(slug, hash) };
}
