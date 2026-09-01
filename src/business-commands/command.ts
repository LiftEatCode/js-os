export type TransactionRunner<TScope> = <T>(
  work: (scope: TScope) => Promise<T>,
) => Promise<T>;

/**
 * Pair a business-state mutation with a BusinessEvent append.
 * Both run in the same transaction. Either both commit or neither does.
 *
 * The runner is injectable so unit tests can prove rollback without Neon.
 */
export async function commitStateAndEvent<TScope, TResult>(
  runner: TransactionRunner<TScope>,
  mutate: (scope: TScope) => Promise<TResult>,
  appendEvent: (scope: TScope, result: TResult) => Promise<void>,
): Promise<TResult> {
  return runner(async (scope) => {
    const result = await mutate(scope);
    await appendEvent(scope, result);
    return result;
  });
}
