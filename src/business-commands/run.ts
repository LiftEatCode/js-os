import { db } from '../prisma/db.ts';
import { commitStateAndEvent, type TransactionRunner } from './command.ts';

/**
 * Prisma 8 transaction handle. Command implementations must use `tx.orm`,
 * not the global `db`, so writes participate in the same commit.
 */
export type BusinessCommandTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Application command boundary: one PostgreSQL transaction.
 * Throw to roll back. Return to commit.
 */
export async function runBusinessCommand<T>(
  work: (tx: BusinessCommandTx) => Promise<T>,
): Promise<T> {
  return db.transaction(work);
}

export function prismaTransactionRunner(): TransactionRunner<BusinessCommandTx> {
  return runBusinessCommand;
}

export { commitStateAndEvent };
