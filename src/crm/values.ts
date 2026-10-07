// Frontmatter values are untyped: a note edited by hand, an import or an AI
// agent can put anything there. These helpers read them defensively so the
// UI never shows "[object Object]" and writes never crash on odd values.

export type Frontmatter = Record<string, unknown>;

export function textValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return "";
}

export function listValue(value: unknown): string[] {
  return Array.isArray(value) ? value.map(textValue).filter(Boolean) : [];
}
