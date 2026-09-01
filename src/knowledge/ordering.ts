import type { KnowledgeDocument, KnowledgeSection, KnowledgeSectionId } from './types.ts';
import { SECTION_LABELS, SECTION_ORDER } from './constants.ts';

export function compareKnowledgeDocuments(a: KnowledgeDocument, b: KnowledgeDocument): number {
  if (a.order !== undefined || b.order !== undefined) {
    const aOrder = a.order ?? Number.POSITIVE_INFINITY;
    const bOrder = b.order ?? Number.POSITIVE_INFINITY;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
  }

  const aIsIndex = a.slug === a.section;
  const bIsIndex = b.slug === b.section;
  if (aIsIndex !== bIsIndex) {
    return aIsIndex ? -1 : 1;
  }

  return a.relativePath.localeCompare(b.relativePath, 'en', {
    numeric: true,
    sensitivity: 'base',
  });
}

export function groupKnowledgeSections(documents: KnowledgeDocument[]): KnowledgeSection[] {
  const bySection = new Map<KnowledgeSectionId, KnowledgeDocument[]>();
  for (const document of documents) {
    if (!document.inPrimaryNav) {
      continue;
    }
    const list = bySection.get(document.section) ?? [];
    list.push(document);
    bySection.set(document.section, list);
  }

  const sections: KnowledgeSection[] = [];
  for (const id of SECTION_ORDER) {
    const docs = bySection.get(id);
    if (!docs || docs.length === 0) {
      continue;
    }
    sections.push({
      id,
      label: SECTION_LABELS[id],
      documents: [...docs].sort(compareKnowledgeDocuments),
    });
  }
  return sections;
}
