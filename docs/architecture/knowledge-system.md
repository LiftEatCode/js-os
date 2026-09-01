# Knowledge system

**Status:** Implemented (Command Center read-only browser). RAG, embeddings, editing, and a documentation database are not implemented.

Markdown files under `docs/` are the canonical source of truth for JS Solutions operating knowledge. The Command Center Knowledge area renders them. It does not copy them into Neon, create a CMS, or allow editing.

```text
docs/
  ↓
src/knowledge (loader / index)
  ↓
structured document metadata
  ├── Command Center `/app/knowledge`
  └── future RAG / reasoning (not implemented)
```

## Routes

```text
/app/knowledge
/app/knowledge/[...slug]
```

Examples:

```text
/app/knowledge
/app/knowledge?q=approval
/app/knowledge/architecture/overview
/app/knowledge/architecture/agent-architecture
/app/knowledge/decisions/ADR-007-atomic-business-mutation-and-event-recording
/app/knowledge/phases/phase-02-command-center
/app/knowledge/roadmap
```

URLs do not include `.md`. Unknown or unsafe slugs return not found. The catch-all route only resolves slugs from the in-memory document registry. It never joins raw user input onto the filesystem.

## Loader

`src/knowledge/` walks `docs/` at process time (build/request). Public functions:

```text
listKnowledgeDocuments
getKnowledgeDocumentBySlug
getKnowledgeSections
getKnowledgeNavigation
searchKnowledge
```

These do not import React. Later reasoning or retrieval can reuse the same records. Documents are whole Markdown files today. Heading-level chunking is future work; the document record is the unit to split later.

## Indexing rules

- Only `.md` files under `docs/`
- Skip hidden files/directories and `node_modules`
- Repository root `README.md` is out of scope
- `docs/README.md` is the docs landing index. Knowledge `/app/knowledge` replaces it; that file is not a duplicate document route
- Compatibility pointers `docs/architecture.md`, `docs/database.md`, and `docs/data-model.md` remain on disk and remain reachable by slug, but they are omitted from primary navigation so old paths do not clutter the browser
- `docs/decisions/README.md` is the Decisions section index (`/app/knowledge/decisions`)

Title precedence: optional frontmatter `title`, then first H1, then a readable filename. Existing docs do not use frontmatter; support is optional (`title`, `description`, `status`, `order`). Status badges are rendered only from that explicit metadata.

Section order: Overview/top-level, Architecture, Company, Departments, Policies, Operations, Integrations, Decisions, Development, Phases, Roadmap. Within a section: explicit `order` if present, then section-index README, then numeric filename order (ADR-005 before ADR-007, phase-00 before phase-02).

## Rendering

Server-side `react-markdown` + `remark-gfm` + `rehype-slug`. Markdown is turned into React elements. Raw HTML in Markdown is not executed. `dangerouslySetInnerHTML` is not used.

Relative `*.md` links inside `docs/` are rewritten to Knowledge routes. External `http(s)` links stay external (`target="_blank"` `rel="noreferrer"`). Links that resolve outside `docs/` are not turned into a source-code browser. Heading ids are deterministic (`rehype-slug`) so `#fragment` URLs work.

Search is in-process, case-insensitive substring matching over title, section, path, and Markdown text. Query: `/app/knowledge?q=…`. No embeddings, vector database, or external search service.

## What this is not

- No Prisma/Neon reads or writes
- No edit, create, delete, upload, or save
- No authentication change
- No Git last-updated metadata (not a runtime requirement)
- No related-document AI
- No model invocation

## Related

- [Command Center](command-center.md)
- [Phase 2](../phases/phase-02-command-center.md)
