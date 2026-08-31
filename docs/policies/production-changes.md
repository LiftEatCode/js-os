# Production changes

**Status:** Policy direction. Enforcement is not implemented.

AI may eventually:

- inspect code
- create branches
- edit code
- run tests
- prepare pull requests

Those steps still sit behind future tools, permission checks, and (when required) approvals.

## Separately gated operations

The following must remain separately permissioned and approval-gated. They are not implied by “the agent can edit code”:

- production deployment
- DNS changes
- destructive database actions
- pointing any environment at the production database
- applying an unreviewed migration

Development must not mutate production. See [environments](../development/environments.md).

## Intended path

Prepare a change (branch, tests, PR) at `PREPARE`. Production apply waits for explicit tool permission plus owner approval.

See [engineering department](../departments/engineering.md) and [Vercel integration](../integrations/vercel.md).
