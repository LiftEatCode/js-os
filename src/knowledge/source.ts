import fs from 'node:fs';
import path from 'node:path';
import {
  COMPATIBILITY_POINTER_PATHS,
  FEATURED_SLUGS,
  LANDING_INDEX_PATH,
  SECTION_LABELS,
} from './constants.ts';
import { deriveTitle, parseMarkdownDocument } from './markdown.ts';
import { groupKnowledgeSections } from './ordering.ts';
import { relativePathToSlug, toPosixPath } from './paths.ts';
import { searchKnowledgeDocuments as matchKnowledgeDocuments } from './search.ts';
import type {
  KnowledgeDocument,
  KnowledgeSearchHit,
  KnowledgeSection,
  KnowledgeSectionId,
} from './types.ts';

export type KnowledgeSource = {
  listKnowledgeDocuments(): KnowledgeDocument[];
  getKnowledgeDocumentBySlug(slug: string): KnowledgeDocument | null;
  getKnowledgeSections(): KnowledgeSection[];
  getKnowledgeNavigation(): KnowledgeSection[];
  searchKnowledgeDocuments(query: string): KnowledgeSearchHit[];
  getFeaturedDocuments(): KnowledgeDocument[];
};

function sectionFromRelativePath(relativePath: string): KnowledgeSectionId {
  const posix = toPosixPath(relativePath);
  if (COMPATIBILITY_POINTER_PATHS.has(posix)) {
    return 'compatibility';
  }
  if (!posix.includes('/')) {
    if (posix === 'roadmap.md') {
      return 'roadmap';
    }
    return 'overview';
  }
  const folder = posix.split('/')[0];
  switch (folder) {
    case 'architecture':
    case 'company':
    case 'departments':
    case 'policies':
    case 'operations':
    case 'integrations':
    case 'decisions':
    case 'development':
    case 'phases':
      return folder;
    default:
      return 'overview';
  }
}

function collectMarkdownFiles(docsRoot: string): string[] {
  if (!fs.existsSync(docsRoot) || !fs.statSync(docsRoot).isDirectory()) {
    return [];
  }

  const results: string[] = [];
  const stack = [docsRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) {
        continue;
      }
      if (entry.name === 'node_modules') {
        continue;
      }
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      if (!entry.name.toLowerCase().endsWith('.md')) {
        continue;
      }
      results.push(fullPath);
    }
  }
  return results;
}

function loadDocuments(docsRoot: string): KnowledgeDocument[] {
  const root = path.resolve(docsRoot);
  const files = collectMarkdownFiles(root);
  const documents: KnowledgeDocument[] = [];

  for (const filePath of files) {
    const relativePath = toPosixPath(path.relative(root, filePath));
    if (relativePath.split('/').some((part) => part.startsWith('.'))) {
      continue;
    }
    if (relativePath === LANDING_INDEX_PATH) {
      continue;
    }
    const slug = relativePathToSlug(relativePath);
    if (!slug) {
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = parseMarkdownDocument(raw);
    const fileName = path.posix.basename(relativePath);
    const title = deriveTitle(parsed.frontmatter, parsed.body, fileName);
    const section = sectionFromRelativePath(relativePath);
    const inPrimaryNav = !COMPATIBILITY_POINTER_PATHS.has(relativePath);

    documents.push({
      slug,
      title,
      section,
      sectionLabel: SECTION_LABELS[section],
      relativePath,
      content: parsed.body,
      description: parsed.frontmatter.description,
      status: parsed.frontmatter.status,
      order: parsed.frontmatter.order,
      inPrimaryNav,
    });
  }

  return documents.sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath, 'en', { numeric: true, sensitivity: 'base' }),
  );
}

export function createKnowledgeSource(docsRoot: string): KnowledgeSource {
  let cache: KnowledgeDocument[] | null = null;

  const documents = (): KnowledgeDocument[] => {
    if (process.env.NODE_ENV !== 'development' && cache) {
      return cache;
    }
    cache = loadDocuments(docsRoot);
    return cache;
  };

  return {
    listKnowledgeDocuments() {
      return documents();
    },
    getKnowledgeDocumentBySlug(slug: string) {
      if (slug.length === 0 || slug.includes('..') || slug.startsWith('/') || slug.includes('\\')) {
        return null;
      }
      return documents().find((document) => document.slug === slug) ?? null;
    },
    getKnowledgeSections() {
      return groupKnowledgeSections(documents());
    },
    getKnowledgeNavigation() {
      return groupKnowledgeSections(documents());
    },
    searchKnowledgeDocuments(query: string) {
      return matchKnowledgeDocuments(documents(), query);
    },
    getFeaturedDocuments() {
      const bySlug = new Map(documents().map((document) => [document.slug, document]));
      return FEATURED_SLUGS.flatMap((slug) => {
        const document = bySlug.get(slug);
        return document ? [document] : [];
      });
    },
  };
}

const defaultRoot = path.join(process.cwd(), 'docs');
const defaultSource = createKnowledgeSource(defaultRoot);

export const listKnowledgeDocuments = (): KnowledgeDocument[] =>
  defaultSource.listKnowledgeDocuments();
export const getKnowledgeDocumentBySlug = (slug: string): KnowledgeDocument | null =>
  defaultSource.getKnowledgeDocumentBySlug(slug);
export const getKnowledgeSections = (): KnowledgeSection[] => defaultSource.getKnowledgeSections();
export const getKnowledgeNavigation = (): KnowledgeSection[] =>
  defaultSource.getKnowledgeNavigation();
export const searchKnowledge = (query: string): KnowledgeSearchHit[] =>
  defaultSource.searchKnowledgeDocuments(query);
export const getFeaturedKnowledgeDocuments = (): KnowledgeDocument[] =>
  defaultSource.getFeaturedDocuments();
