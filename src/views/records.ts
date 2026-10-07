import type { CrmRecord } from "../crm/repository";
import { textValue } from "../crm/values";

export function recordText(record: CrmRecord, field: string): string {
  return textValue(record.frontmatter[field]);
}

// Stable identity of a card in the manual order: crm_id, which survives renames.
export function cardId(record: CrmRecord): string {
  return recordText(record, "crm_id") || record.path;
}
