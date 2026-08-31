# JS OS Architecture

## Purpose

JS OS is the internal operating system for JS Solutions.

It will provide one central place to understand business state, determine priorities, coordinate work, approve actions, and eventually allow specialized AI agents to perform bounded business operations.

## System boundaries

### JS OS owns

- company-level goals
- business priorities
- work items
- agent definitions
- agent execution history
- approvals
- business events
- cross-system orchestration
- executive business state

### JS Growth owns

- Website Growth Audit
- GBP Audit
- prospects
- campaigns
- outreach workflows
- competitive intelligence
- related product-specific data

JS OS should integrate with JS Growth rather than recreate these systems.

## Architecture principles

### 1. Business state before agents

Agents should operate from durable business state rather than relying only on prompts or conversation history.

### 2. Tools are the execution boundary

Agents must not receive unrestricted access to external services or important state mutations.

Execution occurs through explicit tools.

### 3. Permission-aware actions

Actions will eventually support permission levels such as:

- observe
- recommend
- prepare
- execute

### 4. Human approval where appropriate

Sensitive or consequential actions must support approval requirements.

Examples include:

- sending external communications
- publishing content
- spending money
- production deployments
- refunds

### 5. Auditability

Important automated actions must be traceable.

Future agent runs should record:

- trigger
- relevant input state
- result
- tools requested
- tools executed
- approvals
- errors
- timestamps

### 6. Incremental autonomy

JS OS should begin as a decision-support and coordination system.

Autonomy should increase only after workflows are proven reliable.

## Initial system flow

```text
Goals
  ↓
Business State
  ↓
CEO Review
  ↓
Priorities
  ↓
Work Items
  ↓
Approvals
  ↓
Execution
  ↓
Business Events
  ↓
Updated Business State
```

## Current architecture

For the foundation phase:

```text
Next.js
React
TypeScript
Tailwind
```

Database, FastAPI, queues, workers, LLM providers, and external integrations will be added when their first real use case is implemented.
