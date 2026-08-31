#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/421e1ef51dc9a2b37d73857a0cb776c76c724254e980dfd12461c5ac531c9e4c/contract';
import endContract from '../../snapshots/421e1ef51dc9a2b37d73857a0cb776c76c724254e980dfd12461c5ac531c9e4c/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'agentDefinition',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('instructions', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('permissionLevel', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'agentDefinition_permissionLevel_check_18ea6cb7',
            "\"permissionLevel\" IN ('OBSERVE', 'RECOMMEND', 'PREPARE', 'EXECUTE')",
          ),
          checkExpression(
            'agentDefinition_role_check_cc0de23b',
            "\"role\" IN ('CEO', 'SALES', 'MARKETING', 'CLIENT_OPERATIONS', 'ENGINEERING', 'FINANCE', 'GENERAL')",
          ),
          checkExpression(
            'agentDefinition_status_check_fe77e76c',
            "\"status\" IN ('ACTIVE', 'PAUSED', 'DISABLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'agentRun',
        columns: [
          col('agentDefinitionId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('error', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('inputSnapshot', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('output', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('startedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('triggerReference', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('triggerType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'agentRun_status_check_be53ae1d',
            "\"status\" IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')",
          ),
          checkExpression(
            'agentRun_triggerType_check_297f4d40',
            "\"triggerType\" IN ('MANUAL', 'SCHEDULED', 'BUSINESS_EVENT', 'WORK_ITEM', 'SYSTEM')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'approval',
        columns: [
          col('actionType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('agentRunId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('decidedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('decisionReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('expiresAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('payload', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('requestedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('requestedById', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('requestedByType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('riskLevel', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('workItemId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'approval_requestedByType_check_1048f7e2',
            "\"requestedByType\" IN ('USER', 'AGENT', 'SYSTEM')",
          ),
          checkExpression(
            'approval_riskLevel_check_a114ba6a',
            "\"riskLevel\" IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')",
          ),
          checkExpression(
            'approval_status_check_6bd5878b',
            "\"status\" IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'businessEvent',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('eventType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('metadata', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('occurredAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('sourceId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sourceType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'businessEvent_sourceType_check_9da6f6a4',
            "\"sourceType\" IN ('SYSTEM', 'USER', 'AGENT', 'JS_GROWTH', 'GITHUB', 'EMAIL', 'CALENDAR', 'PAYMENTS', 'OTHER')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'goal',
        columns: [
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('currentValue', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('metricName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('metricUnit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('priority', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('targetDate', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('targetValue', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('timeHorizon', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'goal_priority_check_0838e5f0',
            "\"priority\" IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')",
          ),
          checkExpression(
            'goal_status_check_5ae56698',
            "\"status\" IN ('DRAFT', 'ACTIVE', 'ACHIEVED', 'PAUSED', 'CANCELLED')",
          ),
          checkExpression(
            'goal_timeHorizon_check_3e6bad9b',
            "\"timeHorizon\" IN ('SHORT_TERM', 'QUARTERLY', 'ANNUAL', 'LONG_TERM')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'organization',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('timezone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'organization_status_check_ee520df2',
            "\"status\" IN ('ACTIVE', 'INACTIVE')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'workItem',
        columns: [
          col('agentRunId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('assignedAgentId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('dueAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('goalId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('parentId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('priority', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sourceId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sourceType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('startedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('workType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'workItem_priority_check_0838e5f0',
            "\"priority\" IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')",
          ),
          checkExpression(
            'workItem_sourceType_check_4cee9020',
            "\"sourceType\" IN ('JS_GROWTH', 'GITHUB', 'EMAIL', 'CALENDAR', 'PAYMENTS', 'OTHER')",
          ),
          checkExpression(
            'workItem_status_check_5f213c7d',
            "\"status\" IN ('BACKLOG', 'READY', 'IN_PROGRESS', 'BLOCKED', 'WAITING_APPROVAL', 'COMPLETED', 'CANCELLED')",
          ),
          checkExpression(
            'workItem_workType_check_39327d1a',
            "\"workType\" IN ('TASK', 'REVIEW', 'RESEARCH', 'CONTENT', 'OUTREACH', 'ENGINEERING', 'CLIENT_WORK', 'ADMIN', 'DECISION')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'agentDefinition',
        constraint: 'agentDefinition_organizationId_slug_key',
        columns: ['organizationId', 'slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'organization',
        constraint: 'organization_slug_key',
        columns: ['slug'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'agentDefinition',
        index: 'agentDefinition_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'agentDefinition',
        index: 'agentDefinition_organizationId_role_idx_35d41160',
        columns: ['organizationId', 'role'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'agentDefinition',
        index: 'agentDefinition_organizationId_status_idx_21af5e82',
        columns: ['organizationId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'agentRun',
        index: 'agentRun_agentDefinitionId_createdAt_idx_da35ba50',
        columns: ['agentDefinitionId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'agentRun',
        index: 'agentRun_agentDefinitionId_idx_3b61897d',
        columns: ['agentDefinitionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'agentRun',
        index: 'agentRun_organizationId_createdAt_idx_c52d1cc3',
        columns: ['organizationId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'agentRun',
        index: 'agentRun_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'agentRun',
        index: 'agentRun_organizationId_status_idx_21af5e82',
        columns: ['organizationId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'approval',
        index: 'approval_agentRunId_idx_1f80425e',
        columns: ['agentRunId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'approval',
        index: 'approval_expiresAt_idx_6b6b8c10',
        columns: ['expiresAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'approval',
        index: 'approval_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'approval',
        index: 'approval_organizationId_status_idx_21af5e82',
        columns: ['organizationId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'approval',
        index: 'approval_workItemId_idx_2fd4a055',
        columns: ['workItemId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'businessEvent',
        index: 'businessEvent_organizationId_eventType_idx_0d6dee9b',
        columns: ['organizationId', 'eventType'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'businessEvent',
        index: 'businessEvent_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'businessEvent',
        index: 'businessEvent_organizationId_occurredAt_idx_959410e1',
        columns: ['organizationId', 'occurredAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'businessEvent',
        index: 'businessEvent_sourceType_sourceId_idx_9b8c3bc3',
        columns: ['sourceType', 'sourceId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'goal',
        index: 'goal_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'goal',
        index: 'goal_organizationId_priority_idx_433e555d',
        columns: ['organizationId', 'priority'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'goal',
        index: 'goal_organizationId_status_idx_21af5e82',
        columns: ['organizationId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'goal',
        index: 'goal_targetDate_idx_0073106e',
        columns: ['targetDate'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'workItem',
        index: 'workItem_agentRunId_idx_1f80425e',
        columns: ['agentRunId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'workItem',
        index: 'workItem_assignedAgentId_idx_ea867a24',
        columns: ['assignedAgentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'workItem',
        index: 'workItem_goalId_idx_8733343e',
        columns: ['goalId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'workItem',
        index: 'workItem_organizationId_dueAt_idx_ccae183e',
        columns: ['organizationId', 'dueAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'workItem',
        index: 'workItem_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'workItem',
        index: 'workItem_organizationId_priority_idx_433e555d',
        columns: ['organizationId', 'priority'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'workItem',
        index: 'workItem_organizationId_status_idx_21af5e82',
        columns: ['organizationId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'workItem',
        index: 'workItem_parentId_idx_6a68f597',
        columns: ['parentId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'agentDefinition',
        foreignKey: {
          name: 'agentDefinition_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'organization', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'agentRun',
        foreignKey: {
          name: 'agentRun_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'organization', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'agentRun',
        foreignKey: {
          name: 'agentRun_agentDefinitionId_fkey',
          columns: ['agentDefinitionId'],
          references: { schema: 'public', table: 'agentDefinition', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'approval',
        foreignKey: {
          name: 'approval_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'organization', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'approval',
        foreignKey: {
          name: 'approval_workItemId_fkey',
          columns: ['workItemId'],
          references: { schema: 'public', table: 'workItem', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'approval',
        foreignKey: {
          name: 'approval_agentRunId_fkey',
          columns: ['agentRunId'],
          references: { schema: 'public', table: 'agentRun', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'businessEvent',
        foreignKey: {
          name: 'businessEvent_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'organization', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'goal',
        foreignKey: {
          name: 'goal_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'organization', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'workItem',
        foreignKey: {
          name: 'workItem_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'organization', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'workItem',
        foreignKey: {
          name: 'workItem_goalId_fkey',
          columns: ['goalId'],
          references: { schema: 'public', table: 'goal', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'workItem',
        foreignKey: {
          name: 'workItem_parentId_fkey',
          columns: ['parentId'],
          references: { schema: 'public', table: 'workItem', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'workItem',
        foreignKey: {
          name: 'workItem_agentRunId_fkey',
          columns: ['agentRunId'],
          references: { schema: 'public', table: 'agentRun', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'workItem',
        foreignKey: {
          name: 'workItem_assignedAgentId_fkey',
          columns: ['assignedAgentId'],
          references: { schema: 'public', table: 'agentDefinition', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
