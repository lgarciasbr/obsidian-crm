import { MetadataCache, Notice, TFile, Vault, Workspace } from "obsidian";
import { RelationshipCrmSettings, normalizeFolderPath } from "../settings";
import { today } from "./dates";
import { safeFileName, crmId } from "./file-names";
import { frontmatter, wikilink } from "./frontmatter";
import { EntityFormResult } from "./types";
import { ensureCrmFolders } from "./folders";
import { CrmRepository } from "./repository";
import { addLinkToSection } from "./markdown-sections";

export class EntityCreator {
  constructor(
    private vault: Vault,
    private workspace: Workspace,
    private metadataCache: MetadataCache,
    private settings: RelationshipCrmSettings
  ) {}

  async createPerson(values: EntityFormResult, openFile = true): Promise<void> {
    const companyName = relatedValue(values, "company");
    const createCompany = Boolean(values.company_new?.trim());
    if (createCompany) {
      await this.createCompanyRecord({ name: values.company_new.trim() }, false);
    }

    const repository = this.repository();
    const company = createCompany ? wikilink(values.company_new) : repository.resolveLinkOrText("crm/company", companyName);
    const personFile = await this.createPersonRecord({ ...values, company }, openFile);
    const companyRecord = repository.findByName("crm/company", companyName || values.company_new);
    if (companyRecord) {
      await this.addLinkToRecordSection(companyRecord.path, "Pessoas", wikilink(personFile.basename));
    }
  }

  async createCompany(values: EntityFormResult, openFile = true): Promise<void> {
    await this.createCompanyRecord(values, openFile);
  }

  async createOpportunity(values: EntityFormResult, openFile = true): Promise<void> {
    const company = relatedValue(values, "company");
    const contact = relatedValue(values, "contact");
    const createCompany = Boolean(values.company_new?.trim());
    const createContact = Boolean(values.contact_new?.trim());

    if (createCompany) {
      await this.createCompanyRecord({ name: values.company_new.trim() }, false);
    }

    if (createContact) {
      await this.createPersonRecord({ name: values.contact_new.trim() }, false);
    }

    const name = values.name.trim();
    const fileName = `${safeFileName(company)} - ${safeFileName(name)}.md`;
    const path = await this.nextAvailablePath(`Opportunities/${fileName}`);
    const refreshedRepository = this.repository();
    const content = frontmatter({
      type: "crm/opportunity",
      crm_id: crmId("opportunity", `${company}-${name}`),
      name,
      company: createCompany ? wikilink(values.company_new) : refreshedRepository.resolveLinkOrText("crm/company", company),
      contact: createContact ? wikilink(values.contact_new) : refreshedRepository.resolveLinkOrText("crm/person", contact),
      stage: values.stage || "lead",
      value: values.value,
      notes: values.notes,
      created: today(),
      last_contact: "",
      next_action: "",
      next_action_date: "",
      tags: ["crm/opportunity"],
    }, `# ${company} - ${name}\n\n## Empresa\n\n${refreshedRepository.resolveLinkOrText("crm/company", company) || ""}\n\n## Contato\n\n${refreshedRepository.resolveLinkOrText("crm/person", contact) || ""}\n\n## Situação\n\n## Dor percebida\n\n## Proposta de valor\n\n## Próximos passos\n\n## Histórico\n`);

    const opportunityFile = await this.createAndMaybeOpen(path, content, openFile);
    // R7 backlink symmetry: link the opportunity back from both the company
    // and the contact person, under their "Oportunidades" section.
    const companyRecord = refreshedRepository.findByName("crm/company", createCompany ? values.company_new : company);
    if (companyRecord) {
      await this.addLinkToRecordSection(companyRecord.path, "Oportunidades", wikilink(opportunityFile.basename));
    }
    const contactRecord = refreshedRepository.findByName("crm/person", createContact ? values.contact_new : contact);
    if (contactRecord) {
      await this.addLinkToRecordSection(contactRecord.path, "Oportunidades", wikilink(opportunityFile.basename));
    }
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
    }, `# ${name}\n\n## Contexto\n\n## Oportunidades\n\n## Histórico\n`);

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
    }, `# ${name}\n\n## Contexto\n\n## Pessoas\n\n## Oportunidades\n\n## Histórico\n`);

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

  private async addLinkToRecordSection(path: string, heading: string, link: string): Promise<void> {
    const file = this.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await addLinkToSection(this.vault, file, heading, link);
    }
  }
}

function relatedValue(values: EntityFormResult, key: string): string {
  return values[`${key}_new`]?.trim() || values[key]?.trim() || "";
}
