import { FileManager, MetadataCache, Notice, TFile, Vault, Workspace } from "obsidian";
import { RelationshipCrmSettings, normalizeFolderPath } from "../settings";
import { today } from "./dates";
import { crmId, safeFileName } from "./file-names";
import { frontmatter } from "./frontmatter";
import { ensureCrmFolders } from "./folders";
import { CrmRecord, CrmRepository } from "./repository";
import { addLinkToSection } from "./markdown-sections";
import { resolveLastContact, resolveNextAction } from "./integrity";
import { EntityFormResult } from "./types";

export class InteractionCreator {
  constructor(
    private vault: Vault,
    private workspace: Workspace,
    private metadataCache: MetadataCache,
    private fileManager: FileManager,
    private settings: RelationshipCrmSettings
  ) {}

  async createInteraction(values: EntityFormResult): Promise<void> {
    await ensureCrmFolders(this.vault, this.settings.crmRoot);

    const date = values.date?.trim() || today();
    const kind = values.kind?.trim() || "nota";
    const person = values.person?.trim() || "";
    const company = values.company?.trim() || "";
    const opportunity = values.opportunity?.trim() || "";
    const titleTarget = person || company || "Interaction";
    const title = `${date} - ${kind} - ${titleTarget}`;
    const path = await this.nextAvailablePath(`Interactions/${safeFileName(title)}.md`);
    const repository = new CrmRepository(this.vault, this.metadataCache, this.settings);
    const task = followUpTask(values.next_action, values.next_action_date, this.settings.taskTag);

    const content = frontmatter({
      type: "crm/interaction",
      crm_id: crmId("interaction", title),
      date,
      kind,
      people: person ? [repository.resolveLinkOrText("crm/person", person)] : [],
      company: repository.resolveLinkOrText("crm/company", company),
      opportunity: repository.resolveLinkOrText("crm/opportunity", opportunity),
      next_action: values.next_action,
      next_action_date: values.next_action_date,
      tags: ["crm/interaction"],
    }, `# ${title}\n\n## Resumo\n\n${values.summary || ""}\n\n## Pontos importantes\n\n## Compromissos\n\n## Próxima ação\n\n${task || values.next_action || ""}\n`);

    const file = await this.vault.create(path, content) as TFile;
    const failedUpdates = await this.updateRelatedRecords(repository, {
      person,
      company,
      opportunity,
      date,
      nextAction: values.next_action,
      nextActionDate: values.next_action_date,
      interactionLink: `[[${file.basename}]]`,
    });

    new Notice(`Created ${path}`);
    if (failedUpdates.length) {
      new Notice(`Interaction created, but failed to update: ${failedUpdates.join(", ")}`);
    }
    await this.workspace.getLeaf("tab").openFile(file);
  }

  private async updateRelatedRecords(
    repository: CrmRepository,
    values: {
      person: string;
      company: string;
      opportunity: string;
      date: string;
      nextAction?: string;
      nextActionDate?: string;
      interactionLink: string;
    }
  ): Promise<string[]> {
    const failed: string[] = [];
    const records = [
      repository.findByName("crm/person", values.person),
      repository.findByName("crm/company", values.company),
      repository.findByName("crm/opportunity", values.opportunity),
    ].filter((record): record is CrmRecord => record !== null);

    for (const record of records) {
      try {
        await this.updateRecordFrontmatter(record, values.date, values.nextAction || "", values.nextActionDate || "");
        await this.addHistoryLink(record, values.interactionLink);
      } catch (_error) {
        failed.push(record.name);
      }
    }

    return failed;
  }

  private async addHistoryLink(record: CrmRecord, interactionLink: string): Promise<void> {
    const file = this.vault.getAbstractFileByPath(record.path);
    if (file instanceof TFile) {
      await addLinkToSection(this.vault, file, "Histórico", interactionLink);
    }
  }

  private async updateRecordFrontmatter(
    record: CrmRecord,
    lastContact: string,
    nextAction: string,
    nextActionDate: string
  ): Promise<void> {
    const file = this.vault.getAbstractFileByPath(record.path);
    if (!(file instanceof TFile)) {
      throw new Error(`Record file not found: ${record.path}`);
    }

    // Contract R1/R2: never roll back last_contact, never wipe a pending
    // next_action with an empty incoming action. See docs/project/data-contract.md.
    await this.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.last_contact = resolveLastContact(String(frontmatter.last_contact ?? ""), lastContact);
      const merged = resolveNextAction(
        { action: String(frontmatter.next_action ?? ""), date: String(frontmatter.next_action_date ?? "") },
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

function followUpTask(nextAction: string | undefined, nextActionDate: string | undefined, taskTag: string): string {
  const action = nextAction?.trim();
  if (!action) {
    return "";
  }

  const due = nextActionDate?.trim() ? ` 📅 ${nextActionDate.trim()}` : "";
  const tag = taskTag.trim() ? ` ${taskTag.trim()}` : "";
  return `- [ ] ${action}${due}${tag}`;
}
