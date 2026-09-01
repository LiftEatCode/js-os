import path from 'node:path';
import { KNOWLEDGE_ROUTE_PREFIX, LANDING_INDEX_PATH } from './constants.ts';

export function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

export function isUnsafeSlugSegment(segment: string): boolean {
  if (segment.length === 0) {
    return true;
  }
  if (segment === '.' || segment === '..') {
    return true;
  }
  if (segment.includes('/') || segment.includes('\\')) {
    return true;
  }
  if (segment.includes('\0')) {
    return true;
  }
  return false;
}

export function slugFromParamSegments(segments: readonly string[]): string | null {
  if (segments.length === 0) {
    return null;
  }
  const decoded: string[] = [];
  for (const segment of segments) {
    let value = segment;
    try {
      value = decodeURIComponent(segment);
    } catch {
      return null;
    }
    if (isUnsafeSlugSegment(value)) {
      return null;
    }
    decoded.push(value);
  }
  return decoded.join('/');
}

export function relativePathToSlug(relativePath: string): string | null {
  const posix = toPosixPath(relativePath);
  if (!posix.endsWith('.md')) {
    return null;
  }
  if (posix === LANDING_INDEX_PATH) {
    return null;
  }
  if (posix.startsWith('../') || posix.startsWith('/') || posix.includes('\0')) {
    return null;
  }

  const withoutExt = posix.slice(0, -3);
  const parts = withoutExt.split('/');
  if (parts.some((part) => isUnsafeSlugSegment(part) && part.toLowerCase() !== 'readme')) {
    return null;
  }

  if (parts[parts.length - 1]?.toLowerCase() === 'readme') {
    const parent = parts.slice(0, -1);
    return parent.length === 0 ? null : parent.join('/');
  }
  return withoutExt;
}

export function knowledgeHrefForSlug(slug: string, hash?: string): string {
  const pathHref = `${KNOWLEDGE_ROUTE_PREFIX}/${slug}`;
  return hash ? `${pathHref}#${hash}` : pathHref;
}

export function landingHref(hash?: string): string {
  return hash ? `${KNOWLEDGE_ROUTE_PREFIX}#${hash}` : KNOWLEDGE_ROUTE_PREFIX;
}
