// Pure pipeline rules used by the CRM view. Stage labels are kept as the user
// typed them in Pipeline.md; opportunities store the normalized (lowercase)
// value, so comparisons always go through normalizeStage.

export type StageListResult = { stages: string[] } | { error: "empty" | "exists" };
export type StageRenameResult =
  | { stages: string[]; from: string; to: string }
  | { error: "empty" | "exists" | "unchanged" };

export function normalizeStage(stage: string): string {
  return stage.trim().toLowerCase() || "lead";
}

export function hasStage(stages: readonly string[], stage: string): boolean {
  const target = normalizeStage(stage);
  return stages.some((item) => normalizeStage(item) === target);
}

export function addStage(stages: readonly string[], label: string): StageListResult {
  const clean = label.trim();
  if (!clean) return { error: "empty" };
  if (hasStage(stages, clean)) return { error: "exists" };
  return { stages: [...stages, clean] };
}

export function renameStage(stages: readonly string[], stage: string, label: string): StageRenameResult {
  const clean = label.trim();
  if (!clean) return { error: "empty" };
  if (normalizeStage(clean) === normalizeStage(stage)) return { error: "unchanged" };
  if (hasStage(stages, clean)) return { error: "exists" };
  return {
    stages: stages.map((item) => (item === stage ? clean : item)),
    from: normalizeStage(stage),
    to: normalizeStage(clean),
  };
}

export function removeStage(stages: readonly string[], stage: string): string[] {
  return stages.filter((item) => item !== stage);
}

export function moveStage(stages: readonly string[], source: string, target: string): string[] {
  const from = stages.indexOf(source);
  const to = stages.indexOf(target);
  if (from === -1 || to === -1 || from === to) return [...stages];
  const reordered = [...stages];
  const [moved] = reordered.splice(from, 1);
  reordered.splice(to, 0, moved);
  return reordered;
}

// Parses a user-typed amount in either convention ("15.000,50" or
// "15,000.50"). A lone separator followed by 1–2 digits is a decimal mark;
// otherwise it groups thousands.
export function parseMoney(value: string): number | null {
  const clean = value.replace(/[^\d,.-]/g, "");
  if (!/\d/.test(clean)) return null;

  const lastComma = clean.lastIndexOf(",");
  const lastDot = clean.lastIndexOf(".");
  let normalized: string;
  if (lastComma !== -1 && lastDot !== -1) {
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    normalized = clean.split(thousands).join("").replace(decimal, ".");
  } else {
    const separator = lastComma !== -1 ? "," : lastDot !== -1 ? "." : "";
    const parts = separator ? clean.split(separator) : [clean];
    const isDecimal = parts.length === 2 && parts[1].length >= 1 && parts[1].length <= 2;
    normalized = isDecimal ? parts.join(".") : parts.join("");
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function formatMoney(value: string, currency: string, locale: string): string {
  if (!value.trim()) return "";
  const number = parseMoney(value);
  if (number === null) return value;
  const code = (currency || "BRL").toUpperCase();
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(number);
  } catch {
    return `${code} ${number}`;
  }
}

// Storage stays ISO (YYYY-MM-DD); only the display is localized.
export function formatDate(iso: string, locale: string): string {
  const clean = (iso || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const [y, m, d] = clean.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
  } catch {
    return clean;
  }
}

// Reads a YAML list from the frontmatter of raw file content. Used when the
// metadata cache has not parsed Pipeline.md yet (e.g. right after reopening).
export function frontmatterList(content: string, key: string): string[] | null {
  const block = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!block) return null;
  const out: string[] = [];
  let capturing = false;
  for (const line of block[1].split(/\r?\n/)) {
    if (!capturing) {
      capturing = new RegExp(`^${key}\\s*:\\s*$`).test(line);
      continue;
    }
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item) {
      out.push(item[1].trim().replace(/^["']|["']$/g, ""));
    } else if (/^\S/.test(line)) {
      break;
    }
  }
  return capturing || out.length ? out : null;
}

// Manual card order lives in Pipeline.md as one list of opportunity ids for
// the whole board; a card's column still comes from its stage. Cards missing
// from the list (new, or created outside the board) go last, alphabetically.
export function sortCards<T extends { id: string; name: string }>(cards: readonly T[], order: readonly string[]): T[] {
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...cards].sort((a, b) => {
    const ra = rank.get(a.id);
    const rb = rank.get(b.id);
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });
}

// Returns the new board order after dropping `cardId` into a column whose
// cards are currently shown as `column`, before `beforeId` or, when null, at
// the end of that column.
export function reorderCard(order: readonly string[], column: readonly string[], cardId: string, beforeId: string | null): string[] {
  const next = order.filter((id) => id !== cardId);
  const others = column.filter((id) => id !== cardId);
  for (const id of others) {
    if (!next.includes(id)) next.push(id);
  }

  if (beforeId && beforeId !== cardId && next.includes(beforeId)) {
    next.splice(next.indexOf(beforeId), 0, cardId);
    return next;
  }

  const last = others[others.length - 1];
  next.splice(last === undefined ? next.length : next.indexOf(last) + 1, 0, cardId);
  return next;
}

export function pruneCardOrder(order: readonly string[], existing: readonly string[]): string[] {
  const valid = new Set(existing);
  return [...new Set(order)].filter((id) => valid.has(id));
}
