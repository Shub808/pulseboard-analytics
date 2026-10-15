/**
 * Tiny class-name joiner.
 *
 * `clsx` + `tailwind-merge` would be ~4 KB of dependency for what this project
 * actually needs: conditional joining. Variant maps below never emit
 * conflicting utilities for the same property, so merge semantics aren't
 * required. See docs/adr/0003-dependency-budget.md.
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[];

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  const walk = (value: ClassValue): void => {
    if (!value && value !== 0) return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    out.push(String(value));
  };
  values.forEach(walk);
  return out.join(" ");
}
