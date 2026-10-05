import { FileManager, MetadataCache, Notice, TFile, Vault, Workspace } from "obsidian";
import { CrmSettings, normalizeFolderPath } from "../settings";
import { today } from "./dates";
import { safeFileName, crmId } from "./file-names";
import { frontmatter } from "./frontmatter";
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
    const path = await this.nextAvailablePath(`Opportunities/${safeFileName(companyLabel)} - ${safeFileName(name)}.md`);
    const content = frontmatter({
      type: "crm/opportunity",
      crm_id: crmId("opportunity", `${companyLabel}-${name}`),
      name,
      company: companyValue,
      contact: contactValue,
      stage: values.stage || "lead",
      value: values.value,
      notes: values.notes,
      created: today(),
      last_contact: "",
      next_action: "",
      next_action_date: "",
      tags: ["crm/opportunity"],
    }, opportunityBody(`${companyLabel} - ${name}`, companyValue, contactValue));

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
    const before = this.metadataCache.getFileCache(file)?.frontmatter ?? {};
    const previousCompany = this.findLinked(String(before.company ?? ""), file);
    const previousContact = this.findLinked(String(before.contact ?? ""), file);

    const company = await this.resolveCompany(values, "company");
    const contact = await this.resolvePerson(values, "contact", company);
    const companyValue = company?.link ?? relatedValue(values, "company");
    const contactValue = contact?.link ?? relatedValue(values, "contact");
    const name = values.name?.trim() || String(before.name ?? file.basename);

    for (const [previous, current] of [[previousCompany, company], [previousContact, contact]] as const) {
      if (previous && previous.file.path !== current?.file.path) {
        await removeLinkFromSection(this.vault, previous.file, "Opportunities", linkTo(file));
      }
    }

    await this.fileManager.processFrontMatter(file, (fm) => {
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
      await this.fileManager.processFrontMatter(person.file, (fm) => {
        const current = String(fm.company ?? "").trim();
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
    const target = link.replace(/^\[\[|\]\]$/g, "").split("|")[0].trim();
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

    const content = await this.vault.read(file);
    const updated = content.replace(/^#\s+.*$/m, `# ${file.basename}`);
    if (updated !== content) {
      await this.vault.modify(file, updated);
    }
    return file;
  }

  private async createPersonRecord(values: EntityFormResult, openFile: boolean): Promise<TFile> {
    await ensureCrmFolders(this.vault, this.settings.crmRoot);
    const name = values.name.trim();
    const path = await this.nextAvailablePath(`People/${safeFileName(name)}.md`);
    const content = frontmatter({
      type: "crm/person",
      crm_id: crmId("person", name),
      name,
      company: values.company,
      role: values.role,
      email: values.email,
      phone: values.phone,
      linkedin: values.linkedin,
      last_contact: "",
      next_action: "",
      next_action_date: "",
      tags: ["crm/person"],
    }, `# ${name}\n\n## Context\n\n## Opportunities\n\n## History\n`);

    return this.createAndMaybeOpen(path, content, openFile);
  }

  private async createCompanyRecord(values: EntityFormResult, openFile: boolean): Promise<TFile> {
    await ensureCrmFolders(this.vault, this.settings.crmRoot);
    const name = values.name.trim();
    const path = await this.nextAvailablePath(`Companies/${safeFileName(name)}.md`);
    const content = frontmatter({
      type: "crm/company",
      crm_id: crmId("company", name),
      name,
      site: values.site,
      industry: values.industry,
      last_contact: "",
      next_action: "",
      next_action_date: "",
      tags: ["crm/company"],
    }, `# ${name}\n\n## Context\n\n## People\n\n## Opportunities\n\n## History\n`);

    return this.createAndMaybeOpen(path, content, openFile);
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
    const file = await this.vault.create(path, content) as TFile;
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

function opportunityBody(title: string, company: string, contact: string): string {
  const section = (heading: string, text: string) => (text ? `## ${heading}\n\n${text}\n\n` : `## ${heading}\n\n`);
  return `# ${title}\n\n${section("Company", company)}${section("Contact", contact)}## Situation\n\n## Pain points\n\n## Value proposition\n\n## Next steps\n\n## History\n`;
}
