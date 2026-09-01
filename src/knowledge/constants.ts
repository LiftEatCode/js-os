import type { KnowledgeSectionId } from './types.ts';

export const KNOWLEDGE_ROUTE_PREFIX = '/app/knowledge';

export const SECTION_ORDER: readonly KnowledgeSectionId[] = [
  'overview',
  'architecture',
  'company',
  'departments',
  'policies',
  'operations',
  'integrations',
  'decisions',
  'development',
  'phases',
  'roadmap',
] as const;

export const SECTION_LABELS: Record<KnowledgeSectionId, string> = {
  overview: 'Overview',
  architecture: 'Architecture',
  company: 'Company',
  departments: 'Departments',
  policies: 'Policies',
  operations: 'Operations',
  integrations: 'Integrations',
  decisions: 'Decisions',
  development: 'Development',
  phases: 'Phases',
  roadmap: 'Roadmap',
  compatibility: 'Compatibility',
};

/** Top-level pointer files kept for old links. Indexable, omitted from primary nav. */
export const COMPATIBILITY_POINTER_PATHS = new Set([
  'architecture.md',
  'database.md',
  'data-model.md',
]);

/** Docs index. Knowledge landing replaces it; do not duplicate as a document route. */
export const LANDING_INDEX_PATH = 'README.md';

export const FEATURED_SLUGS = [
  'roadmap',
  'architecture/overview',
  'architecture/command-center',
  'phases/phase-02-command-center',
  'decisions/ADR-007-atomic-business-mutation-and-event-recording',
] as const;
