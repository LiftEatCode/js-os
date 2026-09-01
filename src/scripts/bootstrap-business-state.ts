/**
 * Idempotent bootstrap of required JS Solutions business state.
 *
 * This is foundational company configuration, not disposable demo seed.
 * It is intended for the Neon development database only.
 *
 * Bootstrap establishes missing foundational records. It does not continuously
 * enforce mutable operating configuration.
 *
 * Creates if missing:
 * - 1 Organization (slug: js-solutions)
 * - 6 AgentDefinitions (organizational role rows, not operational agents)
 *
 * Natural keys: Organization.slug; AgentDefinition (organizationId + slug).
 * Existing rows are left as-is except identity drift (unexpected Organization
 * name or AgentDefinition role) which fails loudly.
 *
 * Does not create Goals, WorkItems, Approvals, AgentRuns, BusinessEvents,
 * ToolRequests, or ToolExecutions.
 * Does not delete, truncate, or reset any tables.
 */

import { db } from '../prisma/db.ts';

const ORGANIZATION = {
  name: 'JS Solutions',
  slug: 'js-solutions',
  status: 'ACTIVE' as const,
  timezone: 'America/Chicago',
  description:
    'Web development, SEO, local SEO, digital marketing, AI integration, automation, and business growth systems for small businesses.',
};

const AGENT_DEFINITIONS = [
  {
    name: 'JS OS CEO',
    slug: 'ceo',
    role: 'CEO' as const,
    status: 'ACTIVE' as const,
    permissionLevel: 'RECOMMEND' as const,
    description:
      'Coordinate company-level business state, identify priorities, risks, opportunities, and recommend work across departments.',
  },
  {
    name: 'Sales',
    slug: 'sales',
    role: 'SALES' as const,
    status: 'ACTIVE' as const,
    permissionLevel: 'RECOMMEND' as const,
    description:
      'Eventually evaluate pipeline state, prospecting activity, opportunities, follow-up needs, and sales priorities.',
  },
  {
    name: 'Marketing',
    slug: 'marketing',
    role: 'MARKETING' as const,
    status: 'ACTIVE' as const,
    permissionLevel: 'RECOMMEND' as const,
    description:
      'Eventually evaluate marketing activity, content opportunities, campaigns, visibility, and growth opportunities.',
  },
  {
    name: 'Client Operations',
    slug: 'client-operations',
    role: 'CLIENT_OPERATIONS' as const,
    status: 'ACTIVE' as const,
    permissionLevel: 'RECOMMEND' as const,
    description:
      'Eventually coordinate client delivery, deadlines, outstanding work, risks, and service quality.',
  },
  {
    name: 'Engineering',
    slug: 'engineering',
    role: 'ENGINEERING' as const,
    status: 'ACTIVE' as const,
    permissionLevel: 'RECOMMEND' as const,
    description:
      'Eventually coordinate engineering work, repositories, technical health, deployments, defects, and development priorities.',
  },
  {
    name: 'Finance',
    slug: 'finance',
    role: 'FINANCE' as const,
    status: 'ACTIVE' as const,
    permissionLevel: 'OBSERVE' as const,
    description:
      'Eventually monitor financial state, revenue, expenses, payment status, profitability, and financial risks.',
  },
] as const;

function redactDatabaseTarget(databaseUrl: string): { host: string; database: string } {
  const parsed = new URL(databaseUrl);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  return { host: parsed.hostname, database };
}

function assertDevelopmentBootstrapAllowed(databaseUrl: string): void {
  const target = process.env['JS_OS_BOOTSTRAP_TARGET'];
  if (target !== 'development') {
    throw new Error(
      'Refusing to bootstrap. Set JS_OS_BOOTSTRAP_TARGET=development. Production bootstrap is not supported from this script.',
    );
  }

  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Refusing to bootstrap while NODE_ENV=production.');
  }

  const { host } = redactDatabaseTarget(databaseUrl);
  const hostLower = host.toLowerCase();
  if (
    hostLower.includes('production') ||
    hostLower.includes('-prod-') ||
    hostLower.includes('.prod.')
  ) {
    throw new Error('Refusing to bootstrap: database host looks like production.');
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Load .env.local with the development pooled URL.');
  }

  assertDevelopmentBootstrapAllowed(databaseUrl);

  const target = redactDatabaseTarget(databaseUrl);
  console.log('JS OS business-state bootstrap');
  console.log(`target: development`);
  console.log(`host: ${target.host}`);
  console.log(`database: ${target.database}`);
  console.log(
    'Confirm this host is the Neon DEVELOPMENT branch. Credentials are not printed.',
  );

  await db.transaction(async (tx) => {
    let organization;
    const existingOrganization = await tx.orm.public.Organization.where({
      slug: ORGANIZATION.slug,
    }).first();

    if (existingOrganization) {
      if (existingOrganization.name !== ORGANIZATION.name) {
        throw new Error(
          `Organization slug "${ORGANIZATION.slug}" has name "${existingOrganization.name}"; expected "${ORGANIZATION.name}". Bootstrap will not rewrite it. Human review required.`,
        );
      }
      organization = existingOrganization;
      console.log(`Organization ${ORGANIZATION.slug}: already exists (mutable fields preserved)`);
    } else {
      organization = await tx.orm.public.Organization.create({
        name: ORGANIZATION.name,
        slug: ORGANIZATION.slug,
        description: ORGANIZATION.description,
        timezone: ORGANIZATION.timezone,
        status: ORGANIZATION.status,
      });
      console.log(`Organization ${ORGANIZATION.slug}: created`);
    }

    for (const agent of AGENT_DEFINITIONS) {
      const existingAgent = await tx.orm.public.AgentDefinition.where({
        organizationId: organization.id,
        slug: agent.slug,
      }).first();

      if (existingAgent) {
        if (existingAgent.role !== agent.role) {
          throw new Error(
            `AgentDefinition slug "${agent.slug}" has role ${existingAgent.role}; expected ${agent.role}. Bootstrap will not rewrite it. Human review required.`,
          );
        }
        console.log(
          `AgentDefinition ${agent.slug}: already exists (status=${existingAgent.status} permissionLevel=${existingAgent.permissionLevel}; mutable fields preserved)`,
        );
      } else {
        await tx.orm.public.AgentDefinition.create({
          organizationId: organization.id,
          name: agent.name,
          slug: agent.slug,
          description: agent.description,
          status: agent.status,
          role: agent.role,
          permissionLevel: agent.permissionLevel,
        });
        console.log(`AgentDefinition ${agent.slug}: created`);
      }
    }
  });

  const organizations = await db.orm.public.Organization.select(
    'slug',
    'name',
    'status',
    'timezone',
  ).all();
  const agents = await db.orm.public.AgentDefinition.select(
    'slug',
    'name',
    'role',
    'permissionLevel',
    'status',
  )
    .orderBy((agent) => agent.slug.asc())
    .all();

  console.log(`Organization count: ${organizations.length}`);
  for (const organization of organizations) {
    console.log(
      `  ${organization.slug}  ${organization.name}  ${organization.status}  ${organization.timezone}`,
    );
  }

  console.log(`AgentDefinition count: ${agents.length}`);
  for (const agent of agents) {
    console.log(
      `  ${agent.slug}  ${agent.role}  ${agent.permissionLevel}  ${agent.status}`,
    );
  }

  if (organizations.length !== 1 || organizations[0]?.slug !== ORGANIZATION.slug) {
    throw new Error('Expected exactly one Organization with slug js-solutions.');
  }

  const expectedSlugs = AGENT_DEFINITIONS.map((agent) => agent.slug).toSorted();
  const actualSlugs = agents.map((agent) => agent.slug).toSorted();
  if (agents.length !== AGENT_DEFINITIONS.length) {
    throw new Error(
      `Expected ${AGENT_DEFINITIONS.length} AgentDefinitions, found ${agents.length}.`,
    );
  }
  if (expectedSlugs.join(',') !== actualSlugs.join(',')) {
    throw new Error(`Unexpected AgentDefinition slugs: ${actualSlugs.join(', ')}`);
  }
}

try {
  await main();
} finally {
  await db.close();
}
