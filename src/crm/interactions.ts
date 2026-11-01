import { FileManager, MetadataCache, Notice, TFile, Vault, Workspace } from "obsidian";
import { CrmSettings, normalizeFolderPath } from "../settings";
import { today } from "./dates";
import { safeFileName } from "./file-names";
import { interactionNote, interactionTitle } from "./templates";
import { ensureCrmFolders } from "./folders";
import { CrmRecordType, CrmRepository } from "./repository";
import { cleanLink } from "./links";
import { EntityCreator, EntityRef } from "./entity-creation";
import { completeFollowUpTask, followUpTask } from "./next-action";
import { Frontmatter, listValue, textValue } from "./values";
import { addLinkToSection } from "./markdown-sections";
import { resolveLastContact, resolveNextAction } from "./integrity";
import { EntityFormResult, PendingFollowUp } from "./types";

export class InteractionCreator {
  constructor(
    private vault: Vault,
    private workspace: Workspace,
    private metadataCache: MetadataCache,
    private fileManager: FileManager,
    private settings: CrmSettings,
    private entities: EntityCreator
  ) {}

  async createInteraction(values: EntityFormResult): Promise<void> {
    const mode = values.next_action_mode || (values.next_action?.trim() ? "replace" : "keep");
    if (!["keep", "replace", "complete"].includes(mode)) throw new Error("Invalid follow-up choice.");
    if (mode === "replace" && !values.next_action?.trim()) throw new Error("Next action is required.");
    let completions: PendingFollowUp[] = [];
    if (mode === "complete") {
      const parsed: unknown = JSON.parse(values.complete_follow_ups || "[]");
      if (!Array.isArray(parsed) || !parsed.length || parsed.some((p: PendingFollowUp) =>
        !p || typeof p.path !== "string" || typeof p.action !== "string" || typeof p.date !== "string")) {
        throw new Error("Select the follow-up(s) to complete.");
      }
      completions = parsed as PendingFollowUp[];
    }
    const nextAction = mode === "replace" ? values.next_action : "";
    const nextDate = mode === "replace" ? values.next_action_date : "";
    await ensureCrmFolders(this.vault, this.settings);

    // People and companies typed as new in the form are created first, so the
    // interaction links to the real notes (with their final file names).
    const company = await this.entities.resolveCompany(values, "company");
    const person = await this.entities.resolvePerson(values, "person", company);
    const opportunity = this.findOpportunity(values.opportunity);

    const relatedRecords = [person, company, opportunity].filter((r): r is EntityRef => r !== null);
    for (const pending of completions) {
      if (!relatedRecords.some((r) => r.file.path === pending.path)) {
        throw new Error("A follow-up is no longer related to this interaction. Reopen the form.");
      }
      const file = this.vault.getAbstractFileByPath(pending.path);
      const fm = file instanceof TFile ? this.metadataCache.getFileCache(file)?.frontmatter : undefined;
      if (!fm || textValue(fm.next_action) !== pending.action || textValue(fm.next_action_date) !== pending.date) {
        throw new Error("A follow-up changed while this form was open. Reopen it before completing.");
      }
    }
    const date = values.date?.trim() || today();
    const kind = values.kind?.trim() || "note";
    const target = person?.file.basename || company?.file.basename || "Interaction";
    const title = interactionTitle(date, kind, target);
    const path = await this.nextAvailablePath(`Interactions/${safeFileName(title)}.md`);
    const task = this.settings.createTasksByDefault ? followUpTask(nextAction, nextDate, this.settings.taskTag) : "";
    const content = interactionNote({
      title,
      date,
      kind,
      people: person ? [person.link] : [],
      company: company?.link ?? "",
      opportunity: opportunity?.link ?? "",
      nextAction,
      nextActionDate: nextDate,
      summary: [values.summary, ...completions.map((p) =>
        `Completed follow-up on [[${p.path.split("/").pop()!.replace(/\.md$/, "")}]]: ${p.action}${p.date ? ` (${p.date})` : ""}.`)]
        .filter(Boolean).join("\n\n"),
      task,
    });

    const file = await this.vault.create(path, content);
    const failedUpdates: string[] = [];
    for (const related of [person, company, opportunity]) {
      if (!related) {
        continue;
      }
      try {
        const completion = completions.find((p) => p.path === related.file.path);
        await this.updateRecordFrontmatter(related.file, date, nextAction || "", nextDate || "", completion);
        if (completion) {
          await completeFollowUpTask(this.vault, related.file, completion.action, completion.date, this.settings.taskTag);
        }
        await addLinkToSection(this.vault, related.file, "History", `[[${file.basename}]]`);
      } catch {
        failedUpdates.push(related.file.basename);
      }
    }

    if (completions.length && !failedUpdates.length) {
      try {
        await this.completeHistoricalTasks(completions);
      } catch {
        failedUpdates.push("historical follow-up checkboxes");
      }
    }
    new Notice(`Created ${path}`);
    if (failedUpdates.length) {
      new Notice(`Interaction created, but failed to update: ${failedUpdates.join(", ")}`);
    }
    await this.workspace.getLeaf("tab").openFile(file);
  }

  // A historical interaction may share one task across several related records.
  // Do not mark it done while an unselected record still has that same pending action.
  private async completeHistoricalTasks(completions: PendingFollowUp[]): Promise<void> {
    const repo = new CrmRepository(this.vault, this.metadataCache, this.settings);
    for (const interaction of repo.listRecords("crm/interaction")) {
      const action = textValue(interaction.frontmatter.next_action);
      const date = textValue(interaction.frontmatter.next_action_date);
      const matching = completions.filter((p) => p.action === action && p.date === date);
      if (!matching.length) continue;
      const links: [CrmRecordType, string][] = [
        ...listValue(interaction.frontmatter.people).map((p): [CrmRecordType, string] => ["crm/person", p]),
        ["crm/company", textValue(interaction.frontmatter.company)],
        ["crm/opportunity", textValue(interaction.frontmatter.opportunity)],
      ].filter((entry): entry is [CrmRecordType, string] => Boolean(entry[1]));
      const related = links.map(([type, link]) => repo.findByName(type, cleanLink(link)));
      if (related.some((r) => !r)) continue; // unresolved reference: don't guess
      if (!related.some((r) => matching.some((p) => p.path === r?.path))) continue;
      if (related.some((r) => r && !matching.some((p) => p.path === r.path) &&
          textValue(r.frontmatter.next_action) === action && textValue(r.frontmatter.next_action_date) === date)) continue;
      const file = this.vault.getAbstractFileByPath(interaction.path);
      if (file instanceof TFile) await completeFollowUpTask(this.vault, file, action, date, this.settings.taskTag);
    }
  }

  private findOpportunity(name: string | undefined): EntityRef | null {
    const record = new CrmRepository(this.vault, this.metadataCache, this.settings).findByName("crm/opportunity", name);
    const file = record ? this.vault.getAbstractFileByPath(record.path) : null;
    return file instanceof TFile ? { link: `[[${file.basename}]]`, file } : null;
  }

  private async updateRecordFrontmatter(
    file: TFile,
    lastContact: string,
    nextAction: string,
    nextActionDate: string,
    completion?: PendingFollowUp
  ): Promise<void> {
    // Contract R1/R2: never roll back last_contact, never wipe a pending
    // next_action with an empty incoming action. See docs/data-contract.md.
    await this.fileManager.processFrontMatter(file, (frontmatter: Frontmatter) => {
      if (completion && (textValue(frontmatter.next_action) !== completion.action ||
          textValue(frontmatter.next_action_date) !== completion.date)) {
        throw new Error("Follow-up changed; it was not cleared.");
      }
      frontmatter.last_contact = resolveLastContact(textValue(frontmatter.last_contact), lastContact);
      const merged = completion ? { action: "", date: "" } : resolveNextAction(
        { action: textValue(frontmatter.next_action), date: textValue(frontmatter.next_action_date) },
        nextAction,
        nextActionDate
      );
      frontmatter.next_action = merged.action;
      frontmatter.next_action_date = merged.date;
    });
  }

  private async nextAvailablePath(relativePath: string): Promise<string> {
    const root = normalizeFolderPath(this.settings.crmRoot);
    const extension = ".md";
    const fullPath = `${root}/${relativePath}`;

    if (!this.vault.getAbstractFileByPath(fullPath)) {
      return fullPath;
    }

    const basePath = fullPath.slice(0, -extension.length);
    let counter = 2;
    let candidate = `${basePath} ${counter}${extension}`;

    while (this.vault.getAbstractFileByPath(candidate)) {
      counter += 1;
      candidate = `${basePath} ${counter}${extension}`;
    }

    return candidate;
  }
}
