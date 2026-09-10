/** Read-only development verification of the business-state service layer. */
import { db } from '../prisma/db.ts';
import { getBusinessState, getJsSolutionsOrganization, listActiveAgentDefinitions } from '../business-state/index.ts';

const EXPECTED_SLUGS = ['ceo','sales','marketing','client-operations','engineering','finance'] as const;

try {
  if (typeof Temporal === 'undefined') throw new Error('Temporal is not available. The polyfill in src/prisma/db.ts did not load.');
  const organization = await getJsSolutionsOrganization();
  const createdAtKind = organization.createdAt?.constructor?.name ?? typeof organization.createdAt;
  console.log('JS OS business-state verification (read-only)');
  console.log(`organization: ${organization.name}`);
  console.log(`slug: ${organization.slug}`);
  console.log(`status: ${organization.status}`);
  console.log(`createdAt type: ${createdAtKind}`);
  if (organization.slug !== 'js-solutions' || organization.name !== 'JS Solutions') throw new Error('JS Solutions organization did not match expected identity.');

  const activeAgents = await listActiveAgentDefinitions(organization.id);
  const slugs = activeAgents.map((agent) => agent.slug).toSorted();
  const expected = [...EXPECTED_SLUGS].toSorted();
  if (activeAgents.length !== EXPECTED_SLUGS.length) throw new Error(`Expected ${EXPECTED_SLUGS.length} active AgentDefinitions, found ${activeAgents.length}.`);
  if (slugs.join(',') !== expected.join(',')) throw new Error(`Unexpected AgentDefinition slugs: ${slugs.join(', ')}`);

  const state = await getBusinessState();
  console.log('BusinessState snapshot');
  console.log(`  active goals: ${state.summary.activeGoals}`);
  console.log(`  active work: ${state.summary.activeWorkItems}`);
  console.log(`  blocked work: ${state.summary.blockedWorkItems}`);
  console.log(`  pending approvals: ${state.summary.pendingApprovals}`);
  console.log(`  active agents: ${state.summary.activeAgents}`);
  console.log(`  recent agent runs: ${state.summary.recentAgentRuns}`);
  console.log(`  recent events: ${state.recentEvents.length}`);

  if (state.organization.id !== organization.id) throw new Error('getBusinessState() returned the wrong organization.');
  if (state.summary.activeGoals !== state.goals.length) throw new Error('activeGoals summary does not match goals length.');
  if (state.activeWork.some((item) => item.status === 'BACKLOG' || item.status === 'COMPLETED' || item.status === 'CANCELLED')) throw new Error('getBusinessState() returned a non-active WorkItem in activeWork.');
  if (state.blockedWork.some((item) => item.status !== 'BLOCKED')) throw new Error('getBusinessState() returned a non-blocked WorkItem in blockedWork.');
  if (state.pendingApprovals.some((approval) => approval.status !== 'PENDING')) throw new Error('getBusinessState() returned a non-pending Approval in pendingApprovals.');
  if (state.summary.activeWorkItems !== state.activeWork.length) throw new Error('activeWorkItems summary does not match activeWork length.');
  if (state.summary.blockedWorkItems !== state.blockedWork.length) throw new Error('blockedWorkItems summary does not match blockedWork length.');
  if (state.summary.pendingApprovals !== state.pendingApprovals.length) throw new Error('pendingApprovals summary does not match pendingApprovals length.');
  if (state.summary.activeAgents !== state.agents.filter((agent) => agent.status === 'ACTIVE').length) throw new Error('activeAgents summary does not match active configured agents.');
  if (state.summary.recentAgentRuns !== state.recentAgentRuns.length) throw new Error('recentAgentRuns summary does not match recentAgentRuns length.');
  if (createdAtKind !== 'Instant' && createdAtKind !== 'TemporalInstant') console.log(`warning: createdAt decoded as ${createdAtKind}; expected a Temporal Instant after polyfill.`);
  console.log('verification passed (no --harmony-temporal)');
} finally {
  await db.close();
}
