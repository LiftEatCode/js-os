# Data access

**Status:** Draft operating definition. Auth is not implemented in v0.1.

## Current facts

- Database credentials live in gitignored `.env.local`. Never commit them. Never expose them as `NEXT_PUBLIC_*`.
- Application access is server-side only. `src/prisma/db.ts` must not be imported from client components.
- Development and production Neon branches are isolated. Development commands must not use production credentials.
- JS OS must not join or copy JS Growth tables. Cross-system access is future APIs/tools.

## Direction

Least privilege for future agents: observe business state they are assigned to; do not receive raw database credentials; do not receive unrestricted exports of client or prospect data.

Organization membership and user auth remain outside the Phase 1 model. Access-control implementation waits on that work.

See [database architecture](../architecture/database.md) and [client data](client-data.md).
