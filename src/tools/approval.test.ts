import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Approval } from '../business-state/types.ts';
import {
  TOOL_APPROVAL_PAYLOAD_KIND,
  TOOL_EXECUTE_ACTION_TYPE,
  assertToolRequestAuthorizedForExecution,
  createToolApprovalRequestInput,
  mapToolActorToApprovalRequester,
  mapToolRiskToApprovalRisk,
  toolApprovalDescription,
  toolApprovalTitle,
} from './approval.ts';
import { ToolAuthorizationError, ToolInvariantError } from './errors.ts';
import type { ToolRequest } from './types.ts';

const now = Temporal.Instant.from('2026-09-01T18:00:00Z');
const earlier = Temporal.Instant.from('2026-08-01T00:00:00Z');

function request(overrides: Partial<ToolRequest> = {}): ToolRequest {
  return {
    id: 'req-1',
    organizationId: 'org-1',
    toolSlug: 'test.approval_action',
    toolName: 'Create Work Item',
    toolVersion: 1,
    requiredPermission: 'PREPARE',
    riskLevel: 'MEDIUM',
    approvalRequirement: 'ALWAYS',
    status: 'READY',
    input: { title: 'Ship' },
    requestedByType: 'USER',
    requestedById: 'owner',
    agentDefinitionId: null,
    agentRunId: null,
    workItemId: null,
    approvalId: 'approval-1',
    idempotencyKey: null,
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function approval(overrides: Partial<Approval> = {}): Approval {
  const linked = request();
  return {
    id: 'approval-1',
    organizationId: 'org-1',
    workItemId: null,
    agentRunId: null,
    actionType: TOOL_EXECUTE_ACTION_TYPE,
    title: toolApprovalTitle(linked.toolName),
    description: toolApprovalDescription(linked.toolName),
    status: 'APPROVED',
    riskLevel: 'MEDIUM',
    requestedByType: 'USER',
    requestedById: 'owner',
    requestedAt: now,
    decidedAt: now,
    decisionReason: null,
    expiresAt: null,
    payload: {
      kind: TOOL_APPROVAL_PAYLOAD_KIND,
      toolRequestId: linked.id,
      toolSlug: linked.toolSlug,
      toolName: linked.toolName,
      toolVersion: linked.toolVersion,
      requiredPermission: linked.requiredPermission,
      riskLevel: linked.riskLevel,
      input: linked.input,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('tool approval mapping', () => {
  it('maps all four risk levels explicitly', () => {
    assert.equal(mapToolRiskToApprovalRisk('LOW'), 'LOW');
    assert.equal(mapToolRiskToApprovalRisk('MEDIUM'), 'MEDIUM');
    assert.equal(mapToolRiskToApprovalRisk('HIGH'), 'HIGH');
    assert.equal(mapToolRiskToApprovalRisk('CRITICAL'), 'CRITICAL');
  });

  it('maps requester types explicitly', () => {
    assert.equal(mapToolActorToApprovalRequester('USER'), 'USER');
    assert.equal(mapToolActorToApprovalRequester('AGENT'), 'AGENT');
    assert.equal(mapToolActorToApprovalRequester('SYSTEM'), 'SYSTEM');
  });

  it('builds a deterministic title, description, actionType, and payload snapshot', () => {
    const input = createToolApprovalRequestInput(request());
    assert.equal(input.actionType, TOOL_EXECUTE_ACTION_TYPE);
    assert.equal(input.title, 'Approve tool: Create Work Item');
    assert.equal(
      input.description,
      'Authorize JS OS to execute the Create Work Item capability.',
    );
    assert.deepEqual(input.payload, {
      kind: 'tool_request',
      toolRequestId: 'req-1',
      toolSlug: 'test.approval_action',
      toolName: 'Create Work Item',
      toolVersion: 1,
      requiredPermission: 'PREPARE',
      riskLevel: 'MEDIUM',
      input: { title: 'Ship' },
    });
  });
});

describe('assertToolRequestAuthorizedForExecution', () => {
  it('allows NEVER tools without an Approval', () => {
    assert.doesNotThrow(() =>
      assertToolRequestAuthorizedForExecution(
        request({ approvalRequirement: 'NEVER', approvalId: null }),
        null,
        now,
      ),
    );
  });

  it('allows ALWAYS tools with a valid APPROVED Approval', () => {
    assert.doesNotThrow(() =>
      assertToolRequestAuthorizedForExecution(request(), approval(), now),
    );
  });

  it('rejects missing approvalId on ALWAYS READY requests', () => {
    assert.throws(
      () =>
        assertToolRequestAuthorizedForExecution(
          request({ approvalId: null }),
          null,
          now,
        ),
      ToolInvariantError,
    );
  });

  it('rejects PENDING, REJECTED, CANCELLED, and EXPIRED approvals', () => {
    for (const status of ['PENDING', 'REJECTED', 'CANCELLED', 'EXPIRED'] as const) {
      assert.throws(
        () =>
          assertToolRequestAuthorizedForExecution(request(), approval({ status }), now),
        ToolAuthorizationError,
      );
    }
  });

  it('rejects a cross-organization Approval', () => {
    assert.throws(
      () =>
        assertToolRequestAuthorizedForExecution(
          request(),
          approval({ organizationId: 'org-other' }),
          now,
        ),
      ToolAuthorizationError,
    );
  });

  it('rejects an Approval that represents a different ToolRequest', () => {
    assert.throws(
      () =>
        assertToolRequestAuthorizedForExecution(
          request(),
          approval({
            payload: {
              kind: TOOL_APPROVAL_PAYLOAD_KIND,
              toolRequestId: 'req-other',
              toolSlug: 'test.approval_action',
              toolName: 'Create Work Item',
              toolVersion: 1,
              requiredPermission: 'PREPARE',
              riskLevel: 'MEDIUM',
              input: { title: 'Ship' },
            },
          }),
          now,
        ),
      ToolAuthorizationError,
    );
  });

  it('rejects an APPROVED Approval that is past expiresAt', () => {
    assert.throws(
      () =>
        assertToolRequestAuthorizedForExecution(
          request(),
          approval({ expiresAt: earlier }),
          now,
        ),
      ToolAuthorizationError,
    );
  });
});
