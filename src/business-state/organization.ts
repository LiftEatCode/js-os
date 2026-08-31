import { db } from '../prisma/db.ts';
import { BusinessStateNotFoundError } from './errors.ts';
import { JS_SOLUTIONS_SLUG, type Organization } from './types.ts';

export { JS_SOLUTIONS_SLUG };

export async function getOrganizationById(id: string): Promise<Organization | null> {
  return db.orm.public.Organization.where({ id }).first();
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  return db.orm.public.Organization.where({ slug }).first();
}

/**
 * JS Solutions is required foundational state. Missing row is an error, not a
 * normal empty result. Uses slug `js-solutions`, never a hardcoded UUID.
 */
export async function getJsSolutionsOrganization(): Promise<Organization> {
  const organization = await getOrganizationBySlug(JS_SOLUTIONS_SLUG);
  if (!organization) {
    throw new BusinessStateNotFoundError(
      `Required organization slug "${JS_SOLUTIONS_SLUG}" was not found. Run development bootstrap.`,
    );
  }
  return organization;
}
