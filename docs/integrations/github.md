# GitHub integration

**Status:** Planned. Not implemented.

## Purpose

Connect engineering WorkItems to repositories, issues, and pull requests.

## System of record

GitHub remains canonical for git history, PRs, and CI on those repos. JS OS remains canonical for the WorkItem and Approval that represent the business task.

## Data JS OS may read

Issue/PR identifiers, check status, branch names — as pointers (`sourceType = GITHUB`, `sourceId`). No GitHub client exists yet.

## Actions JS OS may eventually request

Inspect code, create branches, edit, run tests, prepare pull requests. Production merge/deploy stays separately gated.

## Expected approval considerations

- Read-only inspection: lower risk.
- Opening PRs: prepare-level; may still want review.
- Merging to production branches or changing protected settings: owner approval. See [production changes](../policies/production-changes.md).

## Implementation status

Planned. Enum `GITHUB` is reserved on WorkItem/BusinessEvent source types.
