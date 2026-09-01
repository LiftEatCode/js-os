import { db } from '../prisma/db.ts';

/**
 * Prisma 8 ORM surface used by both the global client (`db.orm`) and
 * transaction handles (`tx.orm`). Approval persistence accepts this type so
 * the same domain operations can run in either context.
 */
export type PersistenceOrm = typeof db.orm;
