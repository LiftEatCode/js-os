import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import type { AgentDefinitionStatus, AgentPermissionLevel } from '../business-state/types.ts';
import { defineTool } from './definition.ts';
import {
  createAgentToolActor,
  createSystemToolActor,
  createUserToolActor,
  evaluateToolPermission,
  type ToolPermissionActor,
} from './evaluate-permission.ts';
import type { ToolRequiredPermission } from './types.ts';

const LEVELS = ['OBSERVE', 'RECOMMEND', 'PREPARE', 'EXECUTE'] as const satisfies readonly (
  | AgentPermissionLevel
  | ToolRequiredPermission
)[];

const RANK: Record<(typeof LEVELS)[number], number> = {
  OBSERVE: 0,
  RECOMMEND: 1,
  PREPARE: 2,
  EXECUTE: 3,
};

function tool(overrides?: {
  enabled?: boolean;
  requiredPermission?: ToolRequiredPermission;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  approvalRequirement?: 'NEVER' | 'ALWAYS';
  persistExecution?: boolean;
}) {
  return defineTool({
    slug: 'test.prepare_action',
    name: 'Prepare Action',
    description: 'Prepare a proposed internal action without executing it.',
    version: 1,
    enabled: overrides?.enabled ?? true,
    requiredPermission: overrides?.requiredPermission ?? 'PREPARE',
    riskLevel: overrides?.riskLevel ?? 'LOW',
    approvalRequirement: overrides?.approvalRequirement ?? 'NEVER',
    persistExecution: overrides?.persistExecution ?? true,
    inputSchema: z.object({}),
  });
}

function agent(overrides?: {
  status?: AgentDefinitionStatus;
  permissionLevel?: AgentPermissionLevel;
}): ToolPermissionActor {
  return createAgentToolActor({
    id: 'agent-test-1',
    status: overrides?.status ?? 'ACTIVE',
    permissionLevel: overrides?.permissionLevel ?? 'PREPARE',
  });
}

describe('evaluateToolPermission AGENT matrix', () => {
  for (const ceiling of LEVELS) {
    for (const required of LEVELS) {
      const shouldAllow = RANK[ceiling] >= RANK[required];
      it(`AGENT ${ceiling} vs tool ${required} → ${shouldAllow ? 'allowed' : 'denied'}`, () => {
        const result = evaluateToolPermission(
          agent({ permissionLevel: ceiling }),
          tool({ requiredPermission: required }),
        );
        if (shouldAllow) {
          assert.deepEqual(result, { allowed: true, code: null });
        } else {
          assert.deepEqual(result, { allowed: false, code: 'INSUFFICIENT_PERMISSION' });
        }
      });
    }
  }
});

describe('evaluateToolPermission agent status', () => {
  it('evaluates ceiling when the agent is ACTIVE', () => {
    const result = evaluateToolPermission(
      agent({ status: 'ACTIVE', permissionLevel: 'EXECUTE' }),
      tool({ requiredPermission: 'EXECUTE' }),
    );
    assert.deepEqual(result, { allowed: true, code: null });
  });

  it('denies PAUSED agents even with EXECUTE', () => {
    const result = evaluateToolPermission(
      agent({ status: 'PAUSED', permissionLevel: 'EXECUTE' }),
      tool({ requiredPermission: 'OBSERVE' }),
    );
    assert.deepEqual(result, { allowed: false, code: 'ACTOR_NOT_ALLOWED' });
  });

  it('denies DISABLED agents even with EXECUTE', () => {
    const result = evaluateToolPermission(
      agent({ status: 'DISABLED', permissionLevel: 'EXECUTE' }),
      tool({ requiredPermission: 'OBSERVE' }),
    );
    assert.deepEqual(result, { allowed: false, code: 'ACTOR_NOT_ALLOWED' });
  });

  it('denies AGENT when AgentDefinition context is missing', () => {
    const result = evaluateToolPermission(
      { type: 'AGENT' } as ToolPermissionActor,
      tool(),
    );
    assert.deepEqual(result, { allowed: false, code: 'ACTOR_NOT_ALLOWED' });
  });
});

describe('evaluateToolPermission USER', () => {
  for (const required of LEVELS) {
    it(`allows USER for enabled tool requiring ${required}`, () => {
      const result = evaluateToolPermission(
        createUserToolActor(),
        tool({ requiredPermission: required }),
      );
      assert.deepEqual(result, { allowed: true, code: null });
    });
  }

  it('denies USER when the tool is disabled', () => {
    const result = evaluateToolPermission(
      createUserToolActor('owner'),
      tool({ enabled: false, requiredPermission: 'OBSERVE' }),
    );
    assert.deepEqual(result, { allowed: false, code: 'TOOL_DISABLED' });
  });
});

describe('evaluateToolPermission SYSTEM', () => {
  for (const required of LEVELS) {
    it(`allows SYSTEM for enabled tool requiring ${required}`, () => {
      const result = evaluateToolPermission(
        createSystemToolActor(),
        tool({ requiredPermission: required }),
      );
      assert.deepEqual(result, { allowed: true, code: null });
    });
  }

  it('denies SYSTEM when the tool is disabled', () => {
    const result = evaluateToolPermission(
      createSystemToolActor(),
      tool({ enabled: false, requiredPermission: 'OBSERVE' }),
    );
    assert.deepEqual(result, { allowed: false, code: 'TOOL_DISABLED' });
  });
});

describe('evaluateToolPermission denial precedence', () => {
  it('returns TOOL_DISABLED for a disabled tool even when the agent is paused', () => {
    const result = evaluateToolPermission(
      agent({ status: 'PAUSED', permissionLevel: 'EXECUTE' }),
      tool({ enabled: false, requiredPermission: 'OBSERVE' }),
    );
    assert.deepEqual(result, { allowed: false, code: 'TOOL_DISABLED' });
  });

  it('returns ACTOR_NOT_ALLOWED for an enabled tool and paused agent', () => {
    const result = evaluateToolPermission(
      agent({ status: 'PAUSED', permissionLevel: 'OBSERVE' }),
      tool({ requiredPermission: 'EXECUTE' }),
    );
    assert.deepEqual(result, { allowed: false, code: 'ACTOR_NOT_ALLOWED' });
  });

  it('returns INSUFFICIENT_PERMISSION for an active agent below the required ceiling', () => {
    const result = evaluateToolPermission(
      agent({ status: 'ACTIVE', permissionLevel: 'RECOMMEND' }),
      tool({ requiredPermission: 'PREPARE' }),
    );
    assert.deepEqual(result, { allowed: false, code: 'INSUFFICIENT_PERMISSION' });
  });

  it('returns ACTOR_NOT_ALLOWED for an unsupported actor type', () => {
    const result = evaluateToolPermission(
      { type: 'UNKNOWN' } as unknown as ToolPermissionActor,
      tool(),
    );
    assert.deepEqual(result, { allowed: false, code: 'ACTOR_NOT_ALLOWED' });
  });
});

describe('evaluateToolPermission ignored metadata', () => {
  it('does not deny based on riskLevel', () => {
    const result = evaluateToolPermission(
      createUserToolActor(),
      tool({ requiredPermission: 'EXECUTE', riskLevel: 'CRITICAL' }),
    );
    assert.deepEqual(result, { allowed: true, code: null });
  });

  it('does not deny based on approvalRequirement', () => {
    const result = evaluateToolPermission(
      agent({ permissionLevel: 'EXECUTE' }),
      tool({ requiredPermission: 'EXECUTE', approvalRequirement: 'ALWAYS' }),
    );
    assert.deepEqual(result, { allowed: true, code: null });
  });

  it('does not use persistExecution in the decision', () => {
    const withoutHistory = evaluateToolPermission(
      createUserToolActor(),
      tool({ persistExecution: false, requiredPermission: 'EXECUTE' }),
    );
    const withHistory = evaluateToolPermission(
      createUserToolActor(),
      tool({ persistExecution: true, requiredPermission: 'EXECUTE' }),
    );
    assert.deepEqual(withoutHistory, { allowed: true, code: null });
    assert.deepEqual(withHistory, { allowed: true, code: null });
  });
});
