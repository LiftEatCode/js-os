import {
  BusinessStateNotFoundError,
  getBusinessState,
  JS_SOLUTIONS_SLUG,
  type BusinessState,
} from '@/business-state';

export async function loadCommandCenter(
  slug: string = JS_SOLUTIONS_SLUG,
): Promise<BusinessState | null> {
  try {
    return await getBusinessState(slug);
  } catch (error) {
    if (error instanceof BusinessStateNotFoundError) return null;
    throw error;
  }
}
