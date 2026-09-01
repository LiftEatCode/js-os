#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1c08a4d841c264c7a2ce49e0757ae40d524acd1a13a2ff72b86532dfc4deaef5/contract';
import endContract from '../../snapshots/1c08a4d841c264c7a2ce49e0757ae40d524acd1a13a2ff72b86532dfc4deaef5/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/421e1ef51dc9a2b37d73857a0cb776c76c724254e980dfd12461c5ac531c9e4c/contract';
import startContract from '../../snapshots/421e1ef51dc9a2b37d73857a0cb776c76c724254e980dfd12461c5ac531c9e4c/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'toolExecution',
        columns: [
          col('attemptNumber', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('error', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('output', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('startedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('toolRequestId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'toolExecution_status_check_ec07928c',
            "\"status\" IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'toolRequest',
        columns: [
          col('agentDefinitionId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('agentRunId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('approvalId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('approvalRequirement', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('idempotencyKey', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('input', 'jsonb', { notNull: true, codecRef: { codecId: 'pg/jsonb@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('requestedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('requestedById', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('requestedByType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('requiredPermission', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('riskLevel', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('toolName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('toolSlug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('toolVersion', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('workItemId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'toolRequest_approvalRequirement_check_ba5f8288',
            "\"approvalRequirement\" IN ('NEVER', 'ALWAYS')",
          ),
          checkExpression(
            'toolRequest_requestedByType_check_1048f7e2',
            "\"requestedByType\" IN ('USER', 'AGENT', 'SYSTEM')",
          ),
          checkExpression(
            'toolRequest_requiredPermission_check_56b6fa72',
            "\"requiredPermission\" IN ('OBSERVE', 'RECOMMEND', 'PREPARE', 'EXECUTE')",
          ),
          checkExpression(
            'toolRequest_riskLevel_check_a114ba6a',
            "\"riskLevel\" IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')",
          ),
          checkExpression(
            'toolRequest_status_check_5185bc5a',
            "\"status\" IN ('REQUESTED', 'WAITING_APPROVAL', 'READY', 'FULFILLED', 'FAILED', 'CANCELLED', 'DENIED')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'toolExecution',
        constraint: 'toolExecution_toolRequestId_attemptNumber_key',
        columns: ['toolRequestId', 'attemptNumber'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'toolRequest',
        constraint: 'toolRequest_organizationId_toolSlug_idempotencyKey_key',
        columns: ['organizationId', 'toolSlug', 'idempotencyKey'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'toolExecution',
        index: 'toolExecution_organizationId_createdAt_idx_c52d1cc3',
        columns: ['organizationId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'toolExecution',
        index: 'toolExecution_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'toolExecution',
        index: 'toolExecution_organizationId_status_idx_21af5e82',
        columns: ['organizationId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'toolExecution',
        index: 'toolExecution_toolRequestId_idx_8258479f',
        columns: ['toolRequestId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'toolRequest',
        index: 'toolRequest_agentDefinitionId_idx_3b61897d',
        columns: ['agentDefinitionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'toolRequest',
        index: 'toolRequest_agentRunId_idx_1f80425e',
        columns: ['agentRunId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'toolRequest',
        index: 'toolRequest_approvalId_idx_23d09a03',
        columns: ['approvalId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'toolRequest',
        index: 'toolRequest_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'toolRequest',
        index: 'toolRequest_organizationId_status_requestedAt_idx_9c16cf28',
        columns: ['organizationId', 'status', 'requestedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'toolRequest',
        index: 'toolRequest_organizationId_toolSlug_requestedAt_idx_9d4efc96',
        columns: ['organizationId', 'toolSlug', 'requestedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'toolRequest',
        index: 'toolRequest_workItemId_idx_2fd4a055',
        columns: ['workItemId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'toolExecution',
        foreignKey: {
          name: 'toolExecution_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'organization', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'toolExecution',
        foreignKey: {
          name: 'toolExecution_toolRequestId_fkey',
          columns: ['toolRequestId'],
          references: { schema: 'public', table: 'toolRequest', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'toolRequest',
        foreignKey: {
          name: 'toolRequest_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'organization', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'toolRequest',
        foreignKey: {
          name: 'toolRequest_agentDefinitionId_fkey',
          columns: ['agentDefinitionId'],
          references: { schema: 'public', table: 'agentDefinition', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'toolRequest',
        foreignKey: {
          name: 'toolRequest_agentRunId_fkey',
          columns: ['agentRunId'],
          references: { schema: 'public', table: 'agentRun', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'toolRequest',
        foreignKey: {
          name: 'toolRequest_workItemId_fkey',
          columns: ['workItemId'],
          references: { schema: 'public', table: 'workItem', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'toolRequest',
        foreignKey: {
          name: 'toolRequest_approvalId_fkey',
          columns: ['approvalId'],
          references: { schema: 'public', table: 'approval', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
