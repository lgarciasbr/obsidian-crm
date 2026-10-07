import type { FileManager, TFile, Vault } from "obsidian";
import type { CrmSettings } from "../settings";
import { addLineToSectionInFile } from "./markdown-sections";
import type { Frontmatter } from "./values";

// Record types whose notes carry a next action.
export const NEXT_ACTION_TYPES = ["crm/person", "crm/company", "crm/opportunity"];

// A Tasks-plugin compatible follow-up line, or "" when there is no action.
export function followUpTask(action: string | undefined, date: string | undefined, tag: string): string {
  const cleanAction = action?.trim();
  if (!cleanAction) {
    return "";
  }
  const due = date?.trim() ? ` 📅 ${date.trim()}` : "";
  const cleanTag = tag.trim() ? ` ${tag.trim()}` : "";
  return `- [ ] ${cleanAction}${due}${cleanTag}`;
}

export async function setNextAction(
  vault: Vault,
  fileManager: FileManager,
  file: TFile,
  action: string | undefined,
  date: string | undefined,
  settings: CrmSettings
): Promise<void> {
  const cleanAction = action?.trim() || "";
  const cleanDate = date?.trim() || "";

  await fileManager.processFrontMatter(file, (frontmatter: Frontmatter) => {
    frontmatter.next_action = cleanAction;
    frontmatter.next_action_date = cleanDate;
  });

  const task = settings.createTasksByDefault ? followUpTask(cleanAction, cleanDate, settings.taskTag) : "";
  if (task) {
    await addLineToSectionInFile(vault, file, "Next action", task);
  }
}
