import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { rewriteDocsHref } from './links.ts';
import { deriveTitle, parseMarkdownDocument, titleFromFilename } from './markdown.ts';
import { slugFromParamSegments } from './paths.ts';
import { searchKnowledgeDocuments } from './search.ts';
import { createKnowledgeSource } from './source.ts';

const fixturesRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

function fixtureSource() {
  return createKnowledgeSource(fixturesRoot);
}

describe('Knowledge registry', () => {
  it('discovers Markdown under the docs root and derives slugs, titles, and sections', () => {
    const source = fixtureSource();
    const documents = source.listKnowledgeDocuments();
    const bySlug = new Map(documents.map((document) => [document.slug, document]));

    assert.equal(bySlug.has('architecture/overview'), true);
    assert.equal(bySlug.get('architecture/overview')?.title, 'Architecture overview');
    assert.equal(bySlug.get('architecture/overview')?.section, 'architecture');
    assert.equal(bySlug.get('architecture/overview')?.relativePath, 'architecture/overview.md');
    assert.equal(bySlug.get('roadmap')?.section, 'roadmap');
    assert.equal(bySlug.get('decisions')?.title, 'Architecture Decision Records');
    assert.equal(
      bySlug.get('company/frontmatter-example')?.title,
      'Explicit Frontmatter Title',
    );
    assert.equal(bySlug.get('company/frontmatter-example')?.status, 'Planned');
    assert.equal(bySlug.get('company/frontmatter-example')?.order, 1);
  });

  it('excludes the docs README, hidden files, and non-Markdown assets', () => {
    const slugs = fixtureSource()
      .listKnowledgeDocuments()
      .map((document) => document.slug);
    assert.equal(slugs.includes('README'), false);
    assert.equal(slugs.includes(''), false);
    assert.equal(
      fixtureSource()
        .listKnowledgeDocuments()
        .some((document) => document.relativePath.includes('.hidden')),
      false,
    );
    assert.equal(
      fixtureSource()
        .listKnowledgeDocuments()
        .some((document) => document.relativePath.endsWith('.txt')),
      false,
    );
  });

  it('omits compatibility pointer docs from primary navigation but still resolves them', () => {
    const source = fixtureSource();
    const pointer = source.getKnowledgeDocumentBySlug('architecture');
    assert.equal(pointer?.relativePath, 'architecture.md');
    assert.equal(pointer?.inPrimaryNav, false);
    assert.equal(
      source.getKnowledgeNavigation().some((section) =>
        section.documents.some((document) => document.slug === 'architecture'),
      ),
      false,
    );
  });

  it('orders ADRs and phases by semantic numbering, not arbitrary text', () => {
    const source = fixtureSource();
    const decisions = source
      .getKnowledgeNavigation()
      .find((section) => section.id === 'decisions')
      ?.documents.map((document) => document.slug);
    const phases = source
      .getKnowledgeNavigation()
      .find((section) => section.id === 'phases')
      ?.documents.map((document) => document.slug);

    assert.deepEqual(decisions, ['decisions', 'decisions/ADR-005-sample', 'decisions/ADR-007-sample']);
    assert.deepEqual(phases, ['phases/phase-00-foundation', 'phases/phase-02-command-center']);
  });

  it('uses optional frontmatter title before H1 before filename', () => {
    const parsed = parseMarkdownDocument('---\ntitle: From YAML\n---\n\n# From H1\n');
    assert.equal(deriveTitle(parsed.frontmatter, parsed.body, 'file-name.md'), 'From YAML');
    assert.equal(deriveTitle({}, '# Heading One\n', 'file-name.md'), 'Heading One');
    assert.equal(titleFromFilename('agent-architecture.md'), 'Agent Architecture');
    assert.equal(
      titleFromFilename('ADR-007-atomic-business-mutation.md'),
      'ADR-007: Atomic Business Mutation',
    );
  });
});

describe('Knowledge path safety', () => {
  it('rejects traversal, encoded traversal, and unknown slugs', () => {
    const source = fixtureSource();
    assert.equal(source.getKnowledgeDocumentBySlug('../package.json'), null);
    assert.equal(source.getKnowledgeDocumentBySlug('../../package.json'), null);
    assert.equal(source.getKnowledgeDocumentBySlug('..'), null);
    assert.equal(source.getKnowledgeDocumentBySlug('architecture/overview/../../../package.json'), null);
    assert.equal(slugFromParamSegments(['..', 'package.json']), null);
    assert.equal(slugFromParamSegments(['%2e%2e']), null);
    assert.equal(slugFromParamSegments(['%2e%2e', 'package.json']), null);
    assert.equal(source.getKnowledgeDocumentBySlug('does-not-exist'), null);
    assert.equal(
      source.getKnowledgeDocumentBySlug('architecture/overview')?.title,
      'Architecture overview',
    );
  });
});

describe('Knowledge link rewriting', () => {
  it('rewrites relative Markdown links and leaves anchors and external URLs alone', () => {
    const from = 'policies/approvals.md';
    assert.deepEqual(rewriteDocsHref('../architecture/overview.md', from), {
      kind: 'knowledge',
      href: '/app/knowledge/architecture/overview',
    });
    assert.deepEqual(rewriteDocsHref('./risk.md', from), {
      kind: 'knowledge',
      href: '/app/knowledge/policies/risk',
    });
    assert.deepEqual(rewriteDocsHref('../decisions/ADR-007-sample.md#decision', from), {
      kind: 'knowledge',
      href: '/app/knowledge/decisions/ADR-007-sample#decision',
    });
    assert.deepEqual(rewriteDocsHref('#tables', from), { kind: 'anchor', href: '#tables' });
    assert.deepEqual(rewriteDocsHref('https://example.com/docs', from), {
      kind: 'external',
      href: 'https://example.com/docs',
    });
    assert.deepEqual(rewriteDocsHref('../../package.json', from), {
      kind: 'other',
      href: '../../package.json',
    });
    assert.deepEqual(rewriteDocsHref('../README.md', from), {
      kind: 'knowledge',
      href: '/app/knowledge',
    });
  });
});

describe('Knowledge search', () => {
  it('matches title, section, path, and content case-insensitively', () => {
    const source = fixtureSource();
    const documents = source.listKnowledgeDocuments();

    assert.equal(searchKnowledgeDocuments(documents, '').length, 0);
    assert.ok(source.searchKnowledgeDocuments('Architecture overview').some((hit) => hit.slug === 'architecture/overview'));
    assert.ok(source.searchKnowledgeDocuments('POLICIES').some((hit) => hit.section === 'policies'));
    assert.ok(source.searchKnowledgeDocuments('ADR-007-sample.md').some((hit) => hit.slug === 'decisions/ADR-007-sample'));
    assert.ok(source.searchKnowledgeDocuments('permission ceiling').some((hit) => hit.slug === 'architecture/agent-architecture'));
    assert.equal(source.searchKnowledgeDocuments('zzzz-no-such-term').length, 0);
  });
});
