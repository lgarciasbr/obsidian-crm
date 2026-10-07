import { FileManager, MetadataCache, Notice, TFile, Vault, Workspace } from "obsidian";
import { CrmSettings, normalizeFolderPath } from "../settings";
import { today } from "./dates";
import { safeFileName } from "./file-names";
import { interactionNote, interactionTitle } from "./templates";
import { ensureCrmFolders } from "./folders";
import { CrmRepository } from "./repository";
import { EntityCreator, EntityRef } from "./entity-creation";
import { followUpTask } from "./next-action";
import { Frontmatter, textValue } from "./values";
import { addLinkToSection } from "./markdown-sections";
import { resolveLastContact, resolveNextAction } from "./integrity";
import { EntityFormResult } from "./types";

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
    await ensureCrmFolders(this.vault, this.settings);

    // People and companies typed as new in the form are created first, so the
    // interaction links to the real notes (with their final file names).
    const company = await this.entities.resolveCompany(values, "company");
    const person = await this.entities.resolvePerson(values, "person", company);
    const opportunity = this.findOpportunity(values.opportunity);

    const date = values.date?.trim() || today();
    const kind = values.kind?.trim() || "note";
    const target = person?.file.basename || company?.file.basename || "Interaction";
    const title = interactionTitle(date, kind, target);
    const path = await this.nextAvailablePath(`Interactions/${safeFileName(title)}.md`);
    const task = this.settings.createTasksByDefault ? followUpTask(values.next_action, values.next_action_date, this.settings.taskTag) : "";
    const content = interactionNote({
      title,
      date,
      kind,
      people: person ? [person.link] : [],
      company: company?.link ?? "",
      opportunity: opportunity?.link ?? "",
      nextAction: values.next_action,
      nextActionDate: values.next_action_date,
      summary: values.summary,
      task,
    });

    const file = await this.vault.create(path, content);
    const failedUpdates: string[] = [];
    for (const related of [person, company, opportunity]) {
      if (!related) {
        continue;
      }
      try {
        await this.updateRecordFrontmatter(related.file, date, values.next_action || "", values.next_action_date || "");
        await addLinkToSection(this.vault, related.file, "History", `[[${file.basename}]]`);
      } catch {
        failedUpdates.push(related.file.basename);
      }
    }

    new Notice(`Created ${path}`);
    if (failedUpdates.length) {
      new Notice(`Interaction created, but failed to update: ${failedUpdates.join(", ")}`);
    }
    await this.workspace.getLeaf("tab").openFile(file);
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
    nextActionDate: string
  ): Promise<void> {
    // Contract R1/R2: never roll back last_contact, never wipe a pending
    // next_action with an empty incoming action. See docs/data-contract.md.
    await this.fileManager.processFrontMatter(file, (frontmatter: Frontmatter) => {
      frontmatter.last_contact = resolveLastContact(textValue(frontmatter.last_contact), lastContact);
      const merged = resolveNextAction(
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
