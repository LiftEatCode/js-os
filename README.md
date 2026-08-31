# JS OS

Internal operating system for JS Solutions.

JS OS is the orchestration and command platform responsible for coordinating business operations across sales, marketing, client operations, engineering, finance, and AI-assisted workflows.

## Product boundaries

### JS Solutions

The company.

### JS Growth

The customer-facing product platform located in the separate `js-growth` repository.

It currently owns systems such as:

- Website Growth Audit
- GBP Audit
- Prospecting Engine
- Competitive Intelligence
- lead and opportunity workflows

JS OS does not duplicate those systems.

Instead, JS OS will eventually consume them as tools and data sources.

### JS OS

The internal operating layer for JS Solutions.

Its responsibilities will include:

- company goals
- business state
- priorities
- work coordination
- AI agents
- approvals
- automation
- business events
- cross-system integrations
- executive reporting

## Architecture direction

The initial application uses:

- Next.js
- React
- TypeScript
- Tailwind CSS

Additional infrastructure will be introduced only when required by an implemented feature.

We will avoid premature infrastructure and agent complexity.

## Core principle

AI may recommend and prepare actions, but JS OS controls what actions are actually permitted to execute.

All future integrations and autonomous actions must pass through explicit tools and permission rules.

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Validation:

```bash
npm run typecheck
npm run lint
npm run build
```

## Status

JS OS is currently in foundation development.
