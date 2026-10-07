import { FileManager, MetadataCache, Notice, TFile, Vault, Workspace } from "obsidian";
import { CrmSettings, normalizeFolderPath } from "../settings";
import { today } from "./dates";
import { safeFileName } from "./file-names";
import { cleanLink } from "./links";
import { Frontmatter, listValue, textValue } from "./values";
import { companyNote, opportunityNote, opportunityTitle, personNote } from "./templates";
import { EntityFormResult } from "./types";
import { ensureCrmFolders } from "./folders";
import { CrmRecordType, CrmRepository } from "./repository";
import { addLinkToSection, removeLinkFromSection, setSectionBodyInFile } from "./markdown-sections";

// A CRM record the current flow can link to. `file` is the actual note, so
// links and backlinks never depend on the metadata cache having indexed a
// note that was created a moment ago.
export interface EntityRef {
  link: string;
  file: TFile;
}

export class EntityCreator {
  constructor(
    private vault: Vault,
    private workspace: Workspace,
    private metadataCache: MetadataCache,
    private fileManager: FileManager,
    private settings: CrmSettings
  ) {}

  async createPerson(values: EntityFormResult, openFile = true): Promise<void> {
    const company = await this.resolveCompany(values, "company");
    const person = await this.createPersonRecord({ ...values, company: company?.link ?? relatedValue(values, "company") }, openFile);
    if (company) {
      await addLinkToSection(this.vault, company.file, "People", linkTo(person));
    }
  }

  async createCompany(values: EntityFormResult, openFile = true): Promise<void> {
    await this.createCompanyRecord(values, openFile);
  }

  async createOpportunity(values: EntityFormResult, openFile = true): Promise<void> {
    const company = await this.resolveCompany(values, "company");
    const contact = await this.resolvePerson(values, "contact", company);
    const companyValue = company?.link ?? relatedValue(values, "company");
    const contactValue = contact?.link ?? relatedValue(values, "contact");
    const companyLabel = company?.file.basename ?? relatedValue(values, "company");

    const name = values.name.trim();
    const path = await this.nextAvailablePath(`Opportunities/${safeFileName(opportunityTitle(companyLabel, name))}.md`);
    const content = opportunityNote({
      name,
      companyLabel,
      company: companyValue,
      contact: contactValue,
      stage: values.stage || "lead",
      value: values.value,
      notes: values.notes,
      created: today(),
    });

    const opportunity = await this.createAndMaybeOpen(path, content, openFile);
    // R7 backlink symmetry: the company and the contact list the opportunity.
    for (const target of [company, contact]) {
      if (target) {
        await addLinkToSection(this.vault, target.file, "Opportunities", linkTo(opportunity));
      }
    }
  }

  // Applies an edit to an existing opportunity and keeps every reference in
  // sync: frontmatter, file name, body sections and backlinks on both sides.
  async updateOpportunity(file: TFile, values: EntityFormResult): Promise<TFile> {
    const before: Frontmatter = this.metadataCache.getFileCache(file)?.frontmatter ?? {};
    const previousCompany = this.findLinked(textValue(before.company), file);
    const previousContact = this.findLinked(textValue(before.contact), file);

    const company = await this.resolveCompany(values, "company");
    const contact = await this.resolvePerson(values, "contact", company);
    const companyValue = company?.link ?? relatedValue(values, "company");
    const contactValue = contact?.link ?? relatedValue(values, "contact");
    const name = values.name?.trim() || (textValue(before.name) || file.basename);

    for (const [previous, current] of [[previousCompany, company], [previousContact, contact]] as const) {
      if (previous && previous.file.path !== current?.file.path) {
        await removeLinkFromSection(this.vault, previous.file, "Opportunities", linkTo(file));
      }
    }

    await this.fileManager.processFrontMatter(file, (fm: Frontmatter) => {
      fm.name = name;
      fm.company = companyValue;
      fm.contact = contactValue;
      fm.value = values.value?.trim() || "";
      fm.stage = (values.stage?.trim() || "lead").toLowerCase();
      fm.notes = values.notes?.trim() || "";
    });

    const renamed = await this.renameOpportunity(file, company?.file.basename ?? relatedValue(values, "company"), name);
    await setSectionBodyInFile(this.vault, renamed, "Company", companyValue);
    await setSectionBodyInFile(this.vault, renamed, "Contact", contactValue);
    for (const target of [company, contact]) {
      if (target) {
        await addLinkToSection(this.vault, target.file, "Opportunities", linkTo(renamed));
      }
    }
    return renamed;
  }

  // Moves an opportunity to the trash (honouring the user's trash setting)
  // after removing every reference to it: the company's and contact's
  // Opportunities sections and its place in the board's card_order.
  async deleteOpportunity(file: TFile): Promise<void> {
    const fm: Frontmatter = this.metadataCache.getFileCache(file)?.frontmatter ?? {};
    for (const linked of [this.findLinked(textValue(fm.company), file), this.findLinked(textValue(fm.contact), file)]) {
      if (linked) {
        await removeLinkFromSection(this.vault, linked.file, "Opportunities", linkTo(file));
      }
    }

    const id = textValue(fm.crm_id);
    const pipeline = this.vault.getAbstractFileByPath(`${normalizeFolderPath(this.settings.crmRoot)}/Pipeline.md`);
    if (id && pipeline instanceof TFile) {
      await this.fileManager.processFrontMatter(pipeline, (pipelineFm: Frontmatter) => {
        if (Array.isArray(pipelineFm.card_order)) {
          pipelineFm.card_order = listValue(pipelineFm.card_order).filter((item) => item !== id);
        }
      });
    }

    await this.fileManager.trashFile(file);
  }

  // Returns the company chosen in the form, creating it when the user typed a
  // new name. Null when nothing was chosen or the name does not resolve.
  async resolveCompany(values: EntityFormResult, key: string): Promise<EntityRef | null> {
    const newName = values[`${key}_new`]?.trim();
    if (newName) {
      return refTo(await this.createCompanyRecord({ name: newName }, false));
    }
    return this.findExisting("crm/company", values[key]);
  }

  // Same as resolveCompany for people. A person created here, or an existing
  // person without a company, is attached to `company` on both sides.
  async resolvePerson(values: EntityFormResult, key: string, company: EntityRef | null): Promise<EntityRef | null> {
    const newName = values[`${key}_new`]?.trim();
    const person = newName
      ? refTo(await this.createPersonRecord({ name: newName, company: company?.link ?? "" }, false))
      : this.findExisting("crm/person", values[key]);
    if (!person || !company) {
      return person;
    }

    let belongsToCompany = Boolean(newName);
    if (!newName) {
      await this.fileManager.processFrontMatter(person.file, (fm: Frontmatter) => {
        const current = textValue(fm.company);
        if (!current) {
          fm.company = company.link;
        }
        belongsToCompany = !current || current === company.link;
      });
    }
    if (belongsToCompany) {
      await addLinkToSection(this.vault, company.file, "People", person.link);
    }
    return person;
  }

  private findExisting(type: CrmRecordType, name: string | undefined): EntityRef | null {
    const record = this.repository().findByName(type, name);
    const file = record ? this.vault.getAbstractFileByPath(record.path) : null;
    return file instanceof TFile ? refTo(file) : null;
  }

  private findLinked(link: string, source: TFile): EntityRef | null {
    const target = cleanLink(link);
    const file = target ? this.metadataCache.getFirstLinkpathDest(target, source.path) : null;
    return file ? refTo(file) : null;
  }

  // Renames the opportunity file (Company - Name) through fileManager, so
  // Obsidian updates links to it, and keeps the H1 title in step.
  private async renameOpportunity(file: TFile, companyLabel: string, name: string): Promise<TFile> {
    const desiredBase = `${safeFileName(companyLabel || "No company")} - ${safeFileName(name)}`;
    if (file.basename !== desiredBase) {
      const dir = file.parent?.path ?? `${normalizeFolderPath(this.settings.crmRoot)}/Opportunities`;
      let target = `${dir}/${desiredBase}.md`;
      let counter = 2;
      while (this.vault.getAbstractFileByPath(target) && target !== file.path) {
        target = `${dir}/${desiredBase} ${counter}.md`;
        counter += 1;
      }
      await this.fileManager.renameFile(file, target);
    }

    await this.vault.process(file, (content) => content.replace(/^#\s+.*$/m, `# ${file.basename}`));
    return file;
  }

  private async createPersonRecord(values: EntityFormResult, openFile: boolean): Promise<TFile> {
    await ensureCrmFolders(this.vault, this.settings);
    const path = await this.nextAvailablePath(`People/${safeFileName(values.name.trim())}.md`);
    return this.createAndMaybeOpen(path, personNote({ ...values, name: values.name }), openFile);
  }

  private async createCompanyRecord(values: EntityFormResult, openFile: boolean): Promise<TFile> {
    await ensureCrmFolders(this.vault, this.settings);
    const path = await this.nextAvailablePath(`Companies/${safeFileName(values.name.trim())}.md`);
    return this.createAndMaybeOpen(path, companyNote({ ...values, name: values.name }), openFile);
  }

  private repository(): CrmRepository {
    return new CrmRepository(this.vault, this.metadataCache, this.settings);
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

  private async createAndMaybeOpen(path: string, content: string, openFile: boolean): Promise<TFile> {
    const file = await this.vault.create(path, content);
    new Notice(`Created ${path}`);
    if (openFile) {
      await this.workspace.getLeaf("tab").openFile(file);
    }
    return file;
  }
}

function relatedValue(values: EntityFormResult, key: string): string {
  return values[`${key}_new`]?.trim() || values[key]?.trim() || "";
}

function refTo(file: TFile): EntityRef {
  return { link: linkTo(file), file };
}

function linkTo(file: TFile): string {
  return `[[${file.basename}]]`;
}
