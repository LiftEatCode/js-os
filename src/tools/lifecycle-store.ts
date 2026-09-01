import { recordBusinessEventWithOrm } from '../business-state/business-events.ts';
import type { PersistenceOrm } from '../business-state/persistence.ts';
import type {
  AgentDefinition,
  AgentRun,
  Organization,
  RecordBusinessEventInput,
  WorkItem,
} from '../business-state/types.ts';
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
  createToolRequestWithOrm,
  findToolRequestByIdempotencyWithOrm,
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
  transitionToolRequestStatus(
    id: string,
    from: ToolRequestStatus,
    to: ToolRequestStatus,
  ): Promise<ToolRequest>;
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
    transitionToolRequestStatus: (id, from, to) =>
      transitionToolRequestStatusWithOrm(orm, id, from, to),
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
