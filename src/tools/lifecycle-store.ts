import { recordBusinessEventWithOrm } from '../business-state/business-events.ts';
import type { PersistenceOrm } from '../business-state/persistence.ts';
import type {
  AgentDefinition,
  AgentRun,
  Approval,
  ApprovalDecisionInput,
  CreateApprovalRequestInput,
  Organization,
  RecordBusinessEventInput,
  WorkItem,
} from '../business-state/types.ts';
import {
  applyApprovalDecisionWithOrm,
  createApprovalRequestWithOrm,
  expirePendingApprovalWithOrm,
  getApprovalByIdWithOrm,
} from '../business-state/approval-persistence.ts';
import type { ApprovalCommandStore } from '../business-commands/approvals.ts';
import type { BusinessCommandTx } from '../business-commands/run.ts';
import {
  createToolExecutionWithOrm,
  getToolExecutionByIdWithOrm,
  listToolExecutionsForRequestWithOrm,
  nextToolExecutionAttemptNumberWithOrm,
  transitionToolExecutionStatusWithOrm,
  type ToolExecutionCompletionFields,
} from './execution-persistence.ts';
import {
  attachToolRequestApprovalIdWithOrm,
  createToolRequestWithOrm,
  findToolRequestByIdempotencyWithOrm,
  getToolRequestByApprovalIdWithOrm,
  getToolRequestByIdWithOrm,
  transitionToolRequestStatusWithOrm,
  type CreateToolRequestRecordInput,
} from './request-persistence.ts';
import type { ToolExecution, ToolExecutionStatus, ToolRequest, ToolRequestStatus } from './types.ts';

export type ToolLifecycleStore = {
  getOrganizationById(id: string): Promise<Pick<Organization, 'id'> | null>;
  getAgentDefinitionById(id: string): Promise<AgentDefinition | null>;
  getAgentRunById(id: string): Promise<AgentRun | null>;
  getWorkItemById(id: string): Promise<WorkItem | null>;
  getToolRequestById(id: string): Promise<ToolRequest | null>;
  findToolRequestByIdempotency(
    organizationId: string,
    toolSlug: string,
    idempotencyKey: string,
  ): Promise<ToolRequest | null>;
  createToolRequest(input: CreateToolRequestRecordInput): Promise<ToolRequest>;
  attachToolRequestApprovalId(id: string, approvalId: string): Promise<ToolRequest>;
  getToolRequestByApprovalId(approvalId: string): Promise<ToolRequest | null>;
  transitionToolRequestStatus(
    id: string,
    from: ToolRequestStatus,
    to: ToolRequestStatus,
  ): Promise<ToolRequest>;
  getApprovalById(id: string): Promise<Approval | null>;
  createApproval(input: CreateApprovalRequestInput): Promise<Approval>;
  applyApprovalDecision(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
    input: ApprovalDecisionInput,
    now: Temporal.Instant,
  ): Promise<Approval>;
  expirePendingApproval(
    id: string,
    now: Temporal.Instant,
    reason?: string | null,
  ): Promise<Approval>;
  getToolExecutionById(id: string): Promise<ToolExecution | null>;
  listToolExecutionsForRequest(toolRequestId: string): Promise<ToolExecution[]>;
  nextAttemptNumber(toolRequestId: string): Promise<number>;
  createToolExecution(input: {
    organizationId: string;
    toolRequestId: string;
    attemptNumber: number;
  }): Promise<ToolExecution>;
  transitionToolExecutionStatus(
    id: string,
    from: ToolExecutionStatus,
    to: ToolExecutionStatus,
    fields: ToolExecutionCompletionFields,
  ): Promise<ToolExecution>;
  recordEvent(input: RecordBusinessEventInput): Promise<void>;
};

export function toolLifecycleStoreFromOrm(orm: PersistenceOrm): ToolLifecycleStore {
  return {
    getOrganizationById: (id) => orm.public.Organization.where({ id }).first(),
    getAgentDefinitionById: (id) => orm.public.AgentDefinition.where({ id }).first(),
    getAgentRunById: (id) => orm.public.AgentRun.where({ id }).first(),
    getWorkItemById: (id) => orm.public.WorkItem.where({ id }).first(),
    getToolRequestById: (id) => getToolRequestByIdWithOrm(orm, id),
    findToolRequestByIdempotency: (organizationId, toolSlug, idempotencyKey) =>
      findToolRequestByIdempotencyWithOrm(orm, organizationId, toolSlug, idempotencyKey),
    createToolRequest: (input) => createToolRequestWithOrm(orm, input),
    attachToolRequestApprovalId: (id, approvalId) =>
      attachToolRequestApprovalIdWithOrm(orm, id, approvalId),
    getToolRequestByApprovalId: (approvalId) => getToolRequestByApprovalIdWithOrm(orm, approvalId),
    transitionToolRequestStatus: (id, from, to) =>
      transitionToolRequestStatusWithOrm(orm, id, from, to),
    getApprovalById: (id) => getApprovalByIdWithOrm(orm, id),
    createApproval: (input) => createApprovalRequestWithOrm(orm, input),
    applyApprovalDecision: (id, status, input, now) =>
      applyApprovalDecisionWithOrm(orm, id, status, input, now),
    expirePendingApproval: (id, now, reason) => expirePendingApprovalWithOrm(orm, id, now, reason),
    getToolExecutionById: (id) => getToolExecutionByIdWithOrm(orm, id),
    listToolExecutionsForRequest: (toolRequestId) =>
      listToolExecutionsForRequestWithOrm(orm, toolRequestId),
    nextAttemptNumber: (toolRequestId) =>
      nextToolExecutionAttemptNumberWithOrm(orm, toolRequestId),
    createToolExecution: (input) => createToolExecutionWithOrm(orm, input),
    transitionToolExecutionStatus: (id, from, to, fields) =>
      transitionToolExecutionStatusWithOrm(orm, id, from, to, fields),
    recordEvent: async (input) => {
      await recordBusinessEventWithOrm(orm, input);
    },
  };
}

export function toolLifecycleStoreFromTx(tx: BusinessCommandTx): ToolLifecycleStore {
  return toolLifecycleStoreFromOrm(tx.orm);
}

export function approvalCommandStoreFromToolStore(
  store: ToolLifecycleStore,
): ApprovalCommandStore {
  return {
    getApprovalById: (id) => store.getApprovalById(id),
    createApproval: (input) => store.createApproval(input),
    applyDecision: (id, status, input, now) => store.applyApprovalDecision(id, status, input, now),
    expirePending: (id, now, reason) => store.expirePendingApproval(id, now, reason),
    recordEvent: (input) => store.recordEvent(input),
  };
}
