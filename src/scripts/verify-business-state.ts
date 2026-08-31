/**
 * Read-only development verification of the business-state service layer.
 * Does not create, update, or delete records.
 */

import { db } from '../prisma/db.ts';
import {
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
    throw new Error(`Expected ${EXPECTED_SLUGS.length} AgentDefinitions, found ${agents.length}.`);
  }
  if (slugs.join(',') !== expected.join(',')) {
    throw new Error(`Unexpected AgentDefinition slugs: ${slugs.join(', ')}`);
  }

  if (createdAtKind !== 'Instant' && createdAtKind !== 'TemporalInstant') {
    console.log(
      `warning: createdAt decoded as ${createdAtKind}; expected a Temporal Instant after polyfill.`,
    );
  }

  console.log('verification passed (no --harmony-temporal)');
} finally {
  await db.close();
}
