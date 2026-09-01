import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { commitStateAndEvent, type TransactionRunner } from './command.ts';

type MemoryScope = {
  mutations: string[];
  events: string[];
};

function memoryRunner(): {
  store: MemoryScope;
  runner: TransactionRunner<MemoryScope>;
} {
  const committed: MemoryScope = { mutations: [], events: [] };
  const runner: TransactionRunner<MemoryScope> = async (work) => {
    const draft: MemoryScope = { mutations: [], events: [] };
    try {
      const result = await work(draft);
      committed.mutations.push(...draft.mutations);
      committed.events.push(...draft.events);
      return result;
    } catch (error) {
      throw error;
    }
  };
  return { store: committed, runner };
}

describe('commitStateAndEvent', () => {
  it('commits mutation and event together on success', async () => {
    const { store, runner } = memoryRunner();
    const result = await commitStateAndEvent(
      runner,
      async (scope) => {
        scope.mutations.push('goal-1');
        return { id: 'goal-1' };
      },
      async (scope, created) => {
        scope.events.push(`goal.created:${created.id}`);
      },
    );
    assert.deepEqual(result, { id: 'goal-1' });
    assert.deepEqual(store.mutations, ['goal-1']);
    assert.deepEqual(store.events, ['goal.created:goal-1']);
  });

  it('does not commit the event when the mutation fails', async () => {
    const { store, runner } = memoryRunner();
    await assert.rejects(
      () =>
        commitStateAndEvent(
          runner,
          async () => {
            throw new Error('mutation failed');
          },
          async (scope) => {
            scope.events.push('should-not-write');
          },
        ),
      /mutation failed/,
    );
    assert.deepEqual(store.mutations, []);
    assert.deepEqual(store.events, []);
  });

  it('does not commit the mutation when the event append fails', async () => {
    const { store, runner } = memoryRunner();
    await assert.rejects(
      () =>
        commitStateAndEvent(
          runner,
          async (scope) => {
            scope.mutations.push('work-1');
            return { id: 'work-1' };
          },
          async () => {
            throw new Error('event failed');
          },
        ),
      /event failed/,
    );
    assert.deepEqual(store.mutations, []);
    assert.deepEqual(store.events, []);
  });
});
