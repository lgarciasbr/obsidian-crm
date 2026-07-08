// Pure integrity rules for the Relationship CRM data contract.
// This module MUST NOT import from "obsidian" so it can be unit-tested in Node.
// See docs/project/data-contract.md.

export type CrmType = "crm/person" | "crm/company" | "crm/opportunity" | "crm/interaction";

export const DEFAULT_STAGES = [
  "lead",
  "conversation",
  "proposal",
  "negotiation",
  "won",
  "lost",
  "paused",
] as const;

export const INTERACTION_KINDS = [
  "ligação",
  "reunião",
  "email",
  "whatsapp",
  "linkedin",
  "nota",
  "outro",
] as const;

// Fields written by earlier versions but removed from the contract. Their
// presence on a record is leftover to clean, not valid data.
export const DEPRECATED_FIELDS = ["relationship_temperature", "status", "currency", "outcome"] as const;

export const TEMPERATURES = ["", "cold", "warm", "hot"] as const;
export const OPPORTUNITY_STATUS = ["open", "won", "lost", "paused"] as const;
export const ENTITY_STATUS = ["active", "inactive"] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): boolean {
  if (typeof value !== "string" || value === "") {
    return value === "" || value === undefined || value === null;
  }
  if (!ISO_DATE.test(value)) {
    return false;
  }
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return false;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

// R1 — last_contact never rolls back: keep the most recent valid date.
export function resolveLastContact(existing: string, incoming: string): string {
  const e = (existing || "").trim();
  const i = (incoming || "").trim();
  if (!isIsoDate(i) || i === "") {
    return e;
  }
  if (!isIsoDate(e) || e === "") {
    return i;
  }
  return i > e ? i : e;
}

// R2 — next_action is never silently wiped by an empty incoming action.
export function resolveNextAction(
  existing: { action: string; date: string },
  incomingAction: string,
  incomingDate: string
): { action: string; date: string } {
  const nextAction = (incomingAction || "").trim();
  if (!nextAction) {
    // Empty incoming action must not erase a pending follow-up.
    return {
      action: (existing.action || "").trim(),
      date: (existing.date || "").trim(),
    };
  }
  return { action: nextAction, date: (incomingDate || "").trim() };
}

export interface Violation {
  code: string;
  field?: string;
  message: string;
}

// name identifies person/company/opportunity. Interactions are identified by
// crm_id + basename (date - kind - target) and carry no `name` field.
const REQUIRED_ALL = ["type", "crm_id"];
const REQUIRED_NAMED = ["name"];

// An optional enum is valid when unset (undefined/null/empty) OR within the set.
// YAML serializes an empty field as null, which must count as "not set".
function enumOk(value: unknown, set: readonly string[]): boolean {
  if (value === undefined || value === null || String(value).trim() === "") {
    return true;
  }
  return set.includes(String(value));
}

function dateOk(value: unknown): boolean {
  return value === undefined || value === null || value === "" || isIsoDate(value);
}

export interface ValidateOptions {
  stages?: readonly string[];
}

// R3/R4/R5 — validate a single record's frontmatter against the contract.
export function validateFrontmatter(
  type: string,
  fm: Record<string, unknown>,
  options: ValidateOptions = {}
): Violation[] {
  const violations: Violation[] = [];
  const stages = options.stages && options.stages.length ? options.stages : DEFAULT_STAGES;

  for (const key of DEPRECATED_FIELDS) {
    if (fm[key] !== undefined) {
      violations.push({ code: "DEPRECATED_FIELD", field: key, message: `Deprecated field present (should be removed): ${key}` });
    }
  }

  const required = type === "crm/interaction" ? REQUIRED_ALL : [...REQUIRED_ALL, ...REQUIRED_NAMED];
  for (const key of required) {
    const v = fm[key];
    if (typeof v !== "string" || v.trim() === "") {
      violations.push({ code: "MISSING_REQUIRED", field: key, message: `Missing required field: ${key}` });
    }
  }

  for (const field of ["last_contact", "next_action_date"]) {
    if (!dateOk(fm[field])) {
      violations.push({ code: "BAD_DATE", field, message: `Field ${field} must be empty or YYYY-MM-DD` });
    }
  }

  switch (type) {
    case "crm/person":
    case "crm/company":
      break;
    case "crm/opportunity":
      if (!enumOk(fm.stage === undefined || fm.stage === null ? fm.stage : String(fm.stage).toLowerCase(), stages)) {
        violations.push({ code: "BAD_ENUM", field: "stage", message: `Invalid stage: ${String(fm.stage)}` });
      }
      if (!dateOk(fm.created)) {
        violations.push({ code: "BAD_DATE", field: "created", message: "Field created must be empty or YYYY-MM-DD" });
      }
      break;
    case "crm/interaction":
      if (typeof fm.date !== "string" || fm.date.trim() === "" || !isIsoDate(fm.date)) {
        violations.push({ code: "BAD_DATE", field: "date", message: "Interaction date is required and must be YYYY-MM-DD" });
      }
      if (!enumOk(fm.kind, INTERACTION_KINDS)) {
        violations.push({ code: "BAD_ENUM", field: "kind", message: `Invalid kind: ${String(fm.kind)}` });
      }
      break;
    default:
      violations.push({ code: "BAD_TYPE", field: "type", message: `Unknown CRM type: ${type}` });
  }

  return violations;
}

// R6 — basename uniqueness per type. Returns duplicated basenames.
export function findDuplicateBasenames(records: Array<{ type: string; basename: string }>): Violation[] {
  const seen = new Map<string, number>();
  for (const record of records) {
    const key = `${record.type}::${record.basename.trim().toLowerCase()}`;
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  const violations: Violation[] = [];
  for (const [key, count] of seen) {
    if (count > 1) {
      const basename = key.split("::")[1];
      violations.push({ code: "DUPLICATE_BASENAME", field: basename, message: `Duplicate basename for type: ${key.split("::")[0]} -> ${basename} (${count})` });
    }
  }
  return violations;
}

// Link resolution status used by writers to avoid silently picking a wrong match.
export type Resolution =
  | { status: "none" }
  | { status: "unique"; basename: string }
  | { status: "ambiguous"; matches: string[] };

export function resolveUnique(
  name: string,
  candidates: Array<{ basename: string; name: string }>
): Resolution {
  const needle = (name || "").trim().toLowerCase();
  if (!needle) {
    return { status: "none" };
  }
  const byBasename = candidates.filter((c) => c.basename.trim().toLowerCase() === needle);
  const pool = byBasename.length ? byBasename : candidates.filter((c) => c.name.trim().toLowerCase() === needle);
  if (pool.length === 0) {
    return { status: "none" };
  }
  if (pool.length === 1) {
    return { status: "unique", basename: pool[0].basename };
  }
  return { status: "ambiguous", matches: pool.map((c) => c.basename) };
}
