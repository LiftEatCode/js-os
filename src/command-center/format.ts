/**
 * Human-facing label for stored enum tokens (IN_PROGRESS → In Progress).
 * Keeps short acronyms that are already the product term (CEO, JS).
 */
export function formatEnumLabel(value: string): string {
  if (value === 'JS_GROWTH') {
    return 'JS Growth';
  }
  return value
    .split('_')
    .map((part) => {
      if (part === 'CEO' || part === 'JS') {
        return part;
      }
      return part.charAt(0) + part.slice(1).toLowerCase();
    })
    .join(' ');
}
