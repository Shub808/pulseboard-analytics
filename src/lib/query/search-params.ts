/**
 * Next.js hands `searchParams` to a page as a plain record where a repeated
 * key becomes an array. Everything downstream works with `URLSearchParams`,
 * so the conversion lives here rather than being re-implemented per page.
 */
export function toSearchParams(
  input: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      params.append(key, item);
    }
  }
  return params;
}
