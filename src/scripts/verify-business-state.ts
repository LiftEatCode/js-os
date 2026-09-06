/**
 * Read-only development verification of the business-state service layer.
 * Does not create, update, or delete records.
 */

import { db } from '../prisma/db.ts';
import {
  getBusinessState,
  getJsSolutionsOrganization,
  listActiveAgentDefinitions,
} from '../business-state/index.ts';

const EXPECTED_SLUGS = [
  'ceo',
  'sales',
  'marketing',
  'client-operations',
  'engineering',
  'finance',
] as const;

try {
  if (typeof Temporal === 'undefined') {
    throw new Error('Temporal is not available. The polyfill in src/prisma/db.ts did not load.');
  }

  const organization = await getJsSolutionsOrganization();
  const createdAtKind = organization.createdAt?.constructor?.name ?? typeof organization.createdAt;

  console.log('JS OS business-state verification (read-only)');
  console.log(`organization: ${organization.name}`);
  console.log(`slug: ${organization.slug}`);
  console.log(`status: ${organization.status}`);
  console.log(`createdAt type: ${createdAtKind}`);

  if (organization.slug !== 'js-solutions' || organization.name !== 'JS Solutions') {
    throw new Error('JS Solutions organization did not match expected identity.');
  }

  const agents = await listActiveAgentDefinitions(organization.id);
  const slugs = agents.map((agent) => agent.slug).toSorted();
  const expected = [...EXPECTED_SLUGS].toSorted();

  console.log(`AgentDefinitions: ${agents.length}`);
  for (const agent of agents) {
    console.log(`  ${agent.slug}  ${agent.role}  ${agent.permissionLevel}`);
  }

  if (agents.length !== EXPECTED_SLUGS.length) {
    throw new Error(`Expected ${EXPECTED_SLUGS.length} active AgentDefinitions, found ${agents.length}.`);
  }
  if (slugs.join(',') !== expected.join(',')) {
    throw new Error(`Unexpected AgentDefinition slugs: ${slugs.join(', ')}`);
  }

  const state = await getBusinessState();
  console.log('BusinessState snapshot');
  console.log(`  active goals: ${state.summary.activeGoals}`);
  console.log(`  active work: ${state.summary.activeWorkItems}`);
  console.log(`  blocked work: ${state.summary.blockedWorkItems}`);
  console.log(`  high/critical priority work: ${state.summary.highPriorityWorkItems}`);
  console.log(`  recent events: ${state.recentEvents.length}`);

  if (state.organization.id !== organization.id) {
    throw new Error('getBusinessState() returned the wrong organization.');
  }
  if (state.summary.activeGoals < 3) {
    throw new Error(`Expected at least 3 active goals, found ${state.summary.activeGoals}.`);
  }
  if (state.activeWork.some((item) => item.status === 'BACKLOG' || item.status === 'COMPLETED' || item.status === 'CANCELLED')) {
    throw new Error('getBusinessState() returned a non-active WorkItem in activeWork.');
  }
  if (state.blockedWork.some((item) => item.status !== 'BLOCKED')) {
    throw new Error('getBusinessState() returned a non-blocked WorkItem in blockedWork.');
  }
  if (state.summary.activeWorkItems !== state.activeWork.length) {
    throw new Error('activeWorkItems summary does not match activeWork length.');
  }
  if (state.summary.blockedWorkItems !== state.blockedWork.length) {
    throw new Error('blockedWorkItems summary does not match blockedWork length.');
  }
  if (state.recentEvents.length < 1) {
    throw new Error('Expected at least one recent BusinessEvent. Run npm run db:bootstrap first.');
  }

  if (createdAtKind !== 'Instant' && createdAtKind !== 'TemporalInstant') {
    console.log(`warning: createdAt decoded as ${createdAtKind}; expected a Temporal Instant after polyfill.`);
  }

  console.log('verification passed (no --harmony-temporal)');
} finally {
  await db.close();
}
