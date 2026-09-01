export type KnowledgeSectionId =
  | 'overview'
  | 'architecture'
  | 'company'
  | 'departments'
  | 'policies'
  | 'operations'
  | 'integrations'
  | 'decisions'
  | 'development'
  | 'phases'
  | 'roadmap'
  | 'compatibility';

export type KnowledgeDocument = {
  slug: string;
  title: string;
  section: KnowledgeSectionId;
  sectionLabel: string;
  relativePath: string;
  content: string;
  description?: string;
  status?: string;
  order?: number;
  inPrimaryNav: boolean;
};

export type KnowledgeSection = {
  id: KnowledgeSectionId;
  label: string;
  documents: KnowledgeDocument[];
};

export type KnowledgeSearchHit = {
  slug: string;
  title: string;
  section: KnowledgeSectionId;
  sectionLabel: string;
  relativePath: string;
  excerpt?: string;
};

export type KnowledgeHrefRewrite =
  | { kind: 'knowledge'; href: string }
  | { kind: 'external'; href: string }
  | { kind: 'anchor'; href: string }
  | { kind: 'other'; href: string };
