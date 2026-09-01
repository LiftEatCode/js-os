/**
 * Development-only schema check for ToolRequest / ToolExecution.
 * Creates rows only inside transactions that roll back. Does not bootstrap tools.
 */

import { db } from '../prisma/db.ts';
import { getJsSolutionsOrganization } from '../business-state/index.ts';

class VerifyRollback extends Error {
  constructor() {
    super('VERIFY_ROLLBACK');
    this.name = 'VerifyRollback';
  }
}

function toolRequestFields(
  organizationId: string,
  overrides: {
    toolSlug?: string;
    idempotencyKey?: string | null;
  } = {},
) {
  return {
    organizationId,
    toolSlug: overrides.toolSlug ?? 'internal.create_work_item',
    toolName: 'Create work item',
    toolVersion: 1,
    requiredPermission: 'PREPARE' as const,
    riskLevel: 'LOW' as const,
    approvalRequirement: 'NEVER' as const,
    status: 'REQUESTED' as const,
    input: {},
    requestedByType: 'USER' as const,
    requestedById: null,
    agentDefinitionId: null,
    agentRunId: null,
    workItemId: null,
    approvalId: null,
    idempotencyKey: overrides.idempotencyKey === undefined ? null : overrides.idempotencyKey,
  };
}

async function expectUniqueViolation(work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('unique') || message.includes('Unique') || message.includes('23505')) {
      return;
    }
    throw error;
  }
  throw new Error('Expected a unique-constraint violation.');
}

try {
  if (typeof Temporal === 'undefined') {
    throw new Error('Temporal is not available. The polyfill in src/prisma/db.ts did not load.');
  }

  const organization = await getJsSolutionsOrganization();
  console.log('JS OS tool-schema verification (transaction rollback)');
  console.log(`organization: ${organization.slug}`);

  const requestCount = (await db.orm.public.ToolRequest.all()).length;
  const executionCount = (await db.orm.public.ToolExecution.all()).length;
  console.log(`existing ToolRequest rows: ${requestCount}`);
  console.log(`existing ToolExecution rows: ${executionCount}`);

  try {
    await db.transaction(async (tx) => {
      await tx.orm.public.ToolRequest.create(
        toolRequestFields(organization.id, { idempotencyKey: null }),
      );
      await tx.orm.public.ToolRequest.create(
        toolRequestFields(organization.id, { idempotencyKey: null }),
      );
      throw new VerifyRollback();
    });
    throw new Error('NULL idempotency transaction should have rolled back.');
  } catch (error) {
    if (!(error instanceof VerifyRollback)) {
      throw error;
    }
  }
  console.log('nullable idempotencyKey: multiple NULLs allowed for same org + slug');

  await expectUniqueViolation(async () => {
    await db.transaction(async (tx) => {
      await tx.orm.public.ToolRequest.create(
        toolRequestFields(organization.id, { idempotencyKey: 'verify-same-key' }),
      );
      await tx.orm.public.ToolRequest.create(
        toolRequestFields(organization.id, { idempotencyKey: 'verify-same-key' }),
      );
    });
  });
  console.log('non-null idempotencyKey: duplicate org + slug + key rejected');

  try {
    await db.transaction(async (tx) => {
      await tx.orm.public.ToolRequest.create(
        toolRequestFields(organization.id, {
          toolSlug: 'internal.create_work_item',
          idempotencyKey: 'verify-cross-slug',
        }),
      );
      await tx.orm.public.ToolRequest.create(
        toolRequestFields(organization.id, {
          toolSlug: 'internal.update_work_status',
          idempotencyKey: 'verify-cross-slug',
        }),
      );
      throw new VerifyRollback();
    });
    throw new Error('cross-slug idempotency transaction should have rolled back.');
  } catch (error) {
    if (!(error instanceof VerifyRollback)) {
      throw error;
    }
  }
  console.log('same idempotencyKey allowed for different toolSlug');

  try {
    await db.transaction(async (tx) => {
      const request = await tx.orm.public.ToolRequest.create(
        toolRequestFields(organization.id),
      );
      await tx.orm.public.ToolExecution.create({
        organizationId: organization.id,
        toolRequestId: request.id,
        attemptNumber: 1,
        status: 'QUEUED',
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
      });
      throw new VerifyRollback();
    });
    throw new Error('execution insert transaction should have rolled back.');
  } catch (error) {
    if (!(error instanceof VerifyRollback)) {
      throw error;
    }
  }
  console.log('ToolExecution insert against ToolRequest succeeded (rolled back)');

  await expectUniqueViolation(async () => {
    await db.transaction(async (tx) => {
      const request = await tx.orm.public.ToolRequest.create(
        toolRequestFields(organization.id, { toolSlug: 'internal.update_work_status' }),
      );
      const attempt = {
        organizationId: organization.id,
        toolRequestId: request.id,
        attemptNumber: 1,
        status: 'QUEUED' as const,
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
      };
      await tx.orm.public.ToolExecution.create(attempt);
      await tx.orm.public.ToolExecution.create(attempt);
    });
  });
  console.log('unique (toolRequestId, attemptNumber) rejected duplicates');

  const leftoverRequests = (await db.orm.public.ToolRequest.all()).length;
  const leftoverExecutions = (await db.orm.public.ToolExecution.all()).length;
  if (leftoverRequests !== requestCount || leftoverExecutions !== executionCount) {
    throw new Error('Verification left unexpected ToolRequest or ToolExecution rows.');
  }

  console.log('verification passed (no leftover tool rows)');
} finally {
  await db.close();
}
