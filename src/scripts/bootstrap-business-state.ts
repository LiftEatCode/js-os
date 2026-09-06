/**
 * Idempotent bootstrap of required JS Solutions business state.
 *
 * This is foundational company configuration plus initial operating state for
 * the Neon development database. Bootstrap establishes missing records and
 * does not continuously enforce mutable operating configuration.
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

const GOALS = [
  {
    key: 'qualified-lead-generation',
    title: 'Increase qualified lead generation',
    description:
      'Improve the number and quality of inbound leads from the website, local SEO, audits, referrals, and outbound growth systems.',
    status: 'ACTIVE' as const,
    priority: 'HIGH' as const,
    timeHorizon: 'QUARTERLY' as const,
  },
  {
    key: 'gbp-audit-v1',
    title: 'Launch GBP Audit v1',
    description:
      'Turn the existing GBP audit engine into a reliable, marketable lead-generation and paid audit product.',
    status: 'ACTIVE' as const,
    priority: 'HIGH' as const,
    timeHorizon: 'SHORT_TERM' as const,
  },
  {
    key: 'js-os-platform',
    title: 'Build JS OS operating platform',
    description:
      'Create the operating system that coordinates goals, work, events, agents, approvals, and business intelligence.',
    status: 'ACTIVE' as const,
    priority: 'MEDIUM' as const,
    timeHorizon: 'LONG_TERM' as const,
  },
] as const;

const WORK_ITEMS = [
  {
    sourceId: 'bootstrap:work:gbp-scoring-calibration',
    goalKey: 'gbp-audit-v1',
    title: 'Finish GBP audit scoring calibration',
    description: 'Finalize score, maturity, and confidence calibration before packaging the audit as v1.',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    workType: 'ENGINEERING' as const,
  },
  {
    sourceId: 'bootstrap:work:gbp-offer',
    goalKey: 'gbp-audit-v1',
    title: 'Create GBP audit landing-page offer',
    description: 'Define the offer, positioning, CTA, and conversion path for the GBP Audit v1 launch.',
    status: 'READY' as const,
    priority: 'HIGH' as const,
    workType: 'CONTENT' as const,
  },
  {
    sourceId: 'bootstrap:work:copper-secure-case-study',
    goalKey: 'qualified-lead-generation',
    title: 'Complete Copper Secure website case study',
    description: 'Finish the rebuild and capture outcomes that JS Solutions can use as proof of work.',
    status: 'READY' as const,
    priority: 'MEDIUM' as const,
    workType: 'CLIENT_WORK' as const,
  },
  {
    sourceId: 'bootstrap:work:analytics-evidence-plan',
    goalKey: 'qualified-lead-generation',
    title: 'Document JS Growth analytics evidence integration',
    description: 'Define how GA4, Clarity, Search Console, GBP, and audit evidence should feed JS OS.',
    status: 'BACKLOG' as const,
    priority: 'MEDIUM' as const,
    workType: 'RESEARCH' as const,
  },
  {
    sourceId: 'bootstrap:work:business-state-slice',
    goalKey: 'js-os-platform',
    title: 'Build JS OS Business State vertical slice',
    description: 'Seed real operating state and expose a normalized getBusinessState() service.',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    workType: 'ENGINEERING' as const,
  },
  {
    sourceId: 'bootstrap:work:lifecycle-events',
    goalKey: 'js-os-platform',
    title: 'Automate WorkItem lifecycle BusinessEvents',
    description: 'Record append-only events when work moves through its lifecycle instead of inserting them manually.',
    status: 'BACKLOG' as const,
    priority: 'MEDIUM' as const,
    workType: 'ENGINEERING' as const,
  },
] as const;

const BUSINESS_EVENTS = [
  {
    eventType: 'business_state.vertical_slice.initialized',
    sourceId: 'bootstrap:event:business-state-v0.1',
    title: 'Business State vertical slice initialized',
    description: 'JS Solutions goals, work items, and operating snapshot foundation were established.',
  },
  {
    eventType: 'goal.initialized',
    sourceId: 'bootstrap:event:goal-qualified-lead-generation',
    title: 'Qualified lead generation goal initialized',
    description: 'JS OS began tracking qualified lead generation as an active company goal.',
  },
  {
    eventType: 'goal.initialized',
    sourceId: 'bootstrap:event:goal-gbp-audit-v1',
    title: 'GBP Audit v1 goal initialized',
    description: 'JS OS began tracking the GBP Audit v1 launch as an active company goal.',
  },
  {
    eventType: 'goal.initialized',
    sourceId: 'bootstrap:event:goal-js-os-platform',
    title: 'JS OS platform goal initialized',
    description: 'JS OS began tracking its own platform build as an active company goal.',
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
  console.log('target: development');
  console.log(`host: ${target.host}`);
  console.log(`database: ${target.database}`);
  console.log('Confirm this host is the Neon DEVELOPMENT branch. Credentials are not printed.');

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
        console.log(`AgentDefinition ${agent.slug}: already exists (mutable fields preserved)`);
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

    const goalIds = new Map<string, string>();
    for (const goal of GOALS) {
      const matches = await tx.orm.public.Goal.where({
        organizationId: organization.id,
        title: goal.title,
      }).all();
      if (matches.length > 1) {
        throw new Error(`Multiple goals found for bootstrap title "${goal.title}". Human review required.`);
      }

      const existingGoal = matches[0];
      if (existingGoal) {
        goalIds.set(goal.key, existingGoal.id);
        console.log(`Goal ${goal.key}: already exists (mutable fields preserved)`);
      } else {
        const createdGoal = await tx.orm.public.Goal.create({
          organizationId: organization.id,
          title: goal.title,
          description: goal.description,
          status: goal.status,
          priority: goal.priority,
          timeHorizon: goal.timeHorizon,
          targetDate: null,
          metricName: null,
          metricUnit: null,
          targetValue: null,
          currentValue: null,
          completedAt: null,
        });
        goalIds.set(goal.key, createdGoal.id);
        console.log(`Goal ${goal.key}: created`);
      }
    }

    for (const item of WORK_ITEMS) {
      const matches = await tx.orm.public.WorkItem.where({
        organizationId: organization.id,
        sourceType: 'OTHER',
        sourceId: item.sourceId,
      }).all();
      if (matches.length > 1) {
        throw new Error(`Multiple WorkItems found for bootstrap sourceId "${item.sourceId}".`);
      }
      if (matches[0]) {
        console.log(`WorkItem ${item.sourceId}: already exists (mutable fields preserved)`);
        continue;
      }

      const goalId = goalIds.get(item.goalKey);
      if (!goalId) {
        throw new Error(`Missing goal key "${item.goalKey}" for WorkItem ${item.sourceId}.`);
      }
      const now = Temporal.Now.instant();
      await tx.orm.public.WorkItem.create({
        organizationId: organization.id,
        goalId,
        parentId: null,
        agentRunId: null,
        title: item.title,
        description: item.description,
        status: item.status,
        priority: item.priority,
        workType: item.workType,
        sourceType: 'OTHER',
        sourceId: item.sourceId,
        assignedAgentId: null,
        dueAt: null,
        startedAt: item.status === 'IN_PROGRESS' ? now : null,
        completedAt: null,
      });
      console.log(`WorkItem ${item.sourceId}: created`);
    }

    for (const event of BUSINESS_EVENTS) {
      const matches = await tx.orm.public.BusinessEvent.where({
        organizationId: organization.id,
        eventType: event.eventType,
        sourceType: 'SYSTEM',
        sourceId: event.sourceId,
      }).all();
      if (matches.length > 1) {
        throw new Error(`Multiple BusinessEvents found for bootstrap sourceId "${event.sourceId}".`);
      }
      if (matches[0]) {
        console.log(`BusinessEvent ${event.sourceId}: already exists`);
        continue;
      }

      await tx.orm.public.BusinessEvent.create({
        organizationId: organization.id,
        eventType: event.eventType,
        sourceType: 'SYSTEM',
        sourceId: event.sourceId,
        title: event.title,
        description: event.description,
        occurredAt: Temporal.Now.instant(),
        metadata: null,
      });
      console.log(`BusinessEvent ${event.sourceId}: created`);
    }
  });

  const organization = await db.orm.public.Organization.where({ slug: ORGANIZATION.slug }).first();
  if (!organization) {
    throw new Error('Expected JS Solutions organization after bootstrap.');
  }

  const [agents, goals, workItems, events] = await Promise.all([
    db.orm.public.AgentDefinition.where({ organizationId: organization.id }).all(),
    db.orm.public.Goal.where({ organizationId: organization.id }).all(),
    db.orm.public.WorkItem.where({ organizationId: organization.id }).all(),
    db.orm.public.BusinessEvent.where({ organizationId: organization.id }).all(),
  ]);

  console.log(`AgentDefinition count: ${agents.length}`);
  console.log(`Goal count: ${goals.length}`);
  console.log(`WorkItem count: ${workItems.length}`);
  console.log(`BusinessEvent count: ${events.length}`);

  const expectedAgentSlugs = AGENT_DEFINITIONS.map((agent) => agent.slug).toSorted();
  const actualAgentSlugs = agents.map((agent) => agent.slug).toSorted();
  if (expectedAgentSlugs.some((slug) => !actualAgentSlugs.includes(slug))) {
    throw new Error(`Missing required AgentDefinition slugs: ${expectedAgentSlugs.join(', ')}`);
  }

  for (const goal of GOALS) {
    if (!goals.some((row) => row.title === goal.title)) {
      throw new Error(`Missing bootstrapped goal: ${goal.title}`);
    }
  }
  for (const item of WORK_ITEMS) {
    if (!workItems.some((row) => row.sourceType === 'OTHER' && row.sourceId === item.sourceId)) {
      throw new Error(`Missing bootstrapped WorkItem: ${item.sourceId}`);
    }
  }
  for (const event of BUSINESS_EVENTS) {
    if (!events.some((row) => row.sourceType === 'SYSTEM' && row.sourceId === event.sourceId)) {
      throw new Error(`Missing bootstrapped BusinessEvent: ${event.sourceId}`);
    }
  }
}

try {
  await main();
} finally {
  await db.close();
}
