import { MarkdownView, Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { EntityCreator } from "./src/crm/entity-creation";
import { ensureCrmFolders } from "./src/crm/folders";
import { InteractionCreator } from "./src/crm/interactions";
import { CrmRepository } from "./src/crm/repository";
import { validateRecords, renderReport, RecordInput } from "./src/crm/validator";
import { EntityModal } from "./src/ui/entity-modal";
import { EntityField } from "./src/crm/types";
import { safeFileName } from "./src/crm/file-names";
import {
  DEFAULT_PIPELINE_STAGES,
  ensurePipelineFile,
  CRM_VIEW_TYPE,
  CrmView,
} from "./src/views/crm-view";
import {
  DEFAULT_SETTINGS,
  RelationshipCrmSettings,
  RelationshipCrmSettingTab,
  normalizeFolderPath,
} from "./src/settings";

export default class RelationshipCrmPlugin extends Plugin {
  settings: RelationshipCrmSettings;

  async onload(): Promise<void> {
    console.log("Loading Relationship CRM");

    await this.loadSettings();
    this.addSettingTab(new RelationshipCrmSettingTab(this.app, this));

    this.registerView(
      CRM_VIEW_TYPE,
      (leaf) => new CrmView(
        leaf,
        this.repository(),
        this.app.fileManager,
        this.settings,
        (stage, onCreated) => this.openCreateOpportunityModal(stage, false, onCreated),
        (record, onCreated) => this.openLogInteractionModal({
          opportunity: record.basename,
          company: this.cleanLink(String(record.frontmatter.company || "")),
          person: this.cleanLink(String(record.frontmatter.contact || "")),
        }, onCreated, true),
        (record, onEdited) => this.openEditOpportunityModal(record, onEdited),
        () => this.openCreatePersonModal(true),
        () => this.openCreateCompanyModal(true)
      )
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf) {
          this.openPipelineMarkdownAsCrmView(leaf);
        }
      })
    );

    this.addCommand({
      id: "open-crm",
      name: "Open Relationship CRM",
      callback: () => this.openOrCreateCrm(),
    });

    this.addRibbonIcon("filter", "Abrir Relationship CRM", () => this.openOrCreateCrm());

    this.addCommand({
      id: "initialize-crm-folders",
      name: "Initialize CRM folders",
      callback: async () => {
        await ensureCrmFolders(this.app.vault, this.settings.crmRoot);
        const pipelineFile = await ensurePipelineFile(this.app.vault, this.settings);
        if (pipelineFile) {
          await this.ensurePipelineStages(pipelineFile);
        }
        new Notice("Pastas do Relationship CRM inicializadas.");
      },
    });

    this.addCommand({
      id: "create-person",
      name: "Create person",
      callback: () => this.openCreatePersonModal(),
    });

    this.addCommand({
      id: "create-company",
      name: "Create company",
      callback: () => this.openCreateCompanyModal(),
    });

    this.addCommand({
      id: "create-opportunity",
      name: "Create opportunity",
      callback: () => this.openCreateOpportunityModal(),
    });

    this.addCommand({
      id: "log-interaction",
      name: "Log interaction",
      callback: () => this.openLogInteractionModal(),
    });

    this.addCommand({
      id: "set-next-action",
      name: "Set next action",
      callback: () => this.openSetNextActionModal(),
    });

    this.addCommand({
      id: "validate-crm",
      name: "Validate CRM data",
      callback: () => this.runValidation(),
    });
  }

  private async runValidation(): Promise<void> {
    const records: RecordInput[] = this.repository().listRecords().map((record) => ({
      type: record.type,
      name: record.name,
      basename: record.basename,
      path: record.path,
      frontmatter: record.frontmatter,
    }));

    const report = validateRecords(records, this.pipelineStages());
    const content = renderReport(report, new Date().toISOString());
    const path = `${normalizeFolderPath(this.settings.crmRoot)}/Validation Report.md`;

    const existing = this.app.vault.getAbstractFileByPath(path);
    let file: TFile;
    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, content);
      file = existing;
    } else {
      await ensureCrmFolders(this.app.vault, this.settings.crmRoot);
      file = await this.app.vault.create(path, content) as TFile;
    }

    const issues = report.records.length + (report.duplicates.length ? 1 : 0);
    new Notice(issues === 0
      ? `CRM validado: ${report.total} registros, nenhuma violação.`
      : `CRM validado: ${report.records.length} registro(s) com problema. Veja o relatório.`);
    await this.app.workspace.getLeaf("tab").openFile(file);
  }

  onunload(): void {
    console.log("Unloading Relationship CRM");
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private entityCreator(): EntityCreator {
    return new EntityCreator(this.app.vault, this.app.workspace, this.app.metadataCache, this.settings);
  }

  private repository(): CrmRepository {
    return new CrmRepository(this.app.vault, this.app.metadataCache, this.settings);
  }

  private interactionCreator(): InteractionCreator {
    return new InteractionCreator(this.app.vault, this.app.workspace, this.app.metadataCache, this.app.fileManager, this.settings);
  }

  private openSetNextActionModal(): void {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new Notice("Abra uma nota CRM para definir a próxima ação.");
      return;
    }

    const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
    const type = frontmatter?.type;
    if (!["crm/person", "crm/company", "crm/opportunity"].includes(String(type))) {
      new Notice("Esta nota não é uma pessoa, empresa ou oportunidade do CRM.");
      return;
    }

    new EntityModal(this.app, "Definir próxima ação", [
      { key: "next_action", label: "Próxima ação", defaultValue: String(frontmatter?.next_action || ""), required: true },
      { key: "next_action_date", label: "Data da próxima ação", inputType: "date", defaultValue: String(frontmatter?.next_action_date || "") },
    ], async (values) => this.setNextAction(file, values.next_action, values.next_action_date), "Salvar próxima ação").open();
  }

  private async setNextAction(file: TFile, nextAction: string | undefined, nextActionDate: string | undefined): Promise<void> {
    const action = nextAction?.trim() || "";
    const date = nextActionDate?.trim() || "";

    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.next_action = action;
      frontmatter.next_action_date = date;
    });

    if (this.settings.createTasksByDefault && action) {
      const task = this.followUpTask(action, date);
      const content = await this.app.vault.read(file);
      if (!content.includes(task)) {
        await this.app.vault.modify(file, `${content.trimEnd()}\n\n## Próxima ação\n\n${task}\n`);
      }
    }

    new Notice("Próxima ação atualizada.");
  }

  private followUpTask(action: string, date: string): string {
    const due = date ? ` 📅 ${date}` : "";
    const tag = this.settings.taskTag.trim() ? ` ${this.settings.taskTag.trim()}` : "";
    return `- [ ] ${action}${due}${tag}`;
  }

  private openCreatePersonModal(openAfterCreate = true): void {
    new EntityModal(this.app, "Nova pessoa", [
      { key: "name", label: "Nome", placeholder: "Maria Souza", required: true },
      { key: "company", label: "Empresa", options: this.repository().names("crm/company"), allowCreateNew: true },
      { key: "role", label: "Cargo", placeholder: "CEO" },
      { key: "email", label: "E-mail" },
      { key: "phone", label: "Telefone" },
      { key: "linkedin", label: "LinkedIn" },
    ], async (values) => this.entityCreator().createPerson(values, openAfterCreate), "Criar pessoa").open();
  }

  private openCreateCompanyModal(openAfterCreate = true): void {
    new EntityModal(this.app, "Nova empresa", [
      { key: "name", label: "Nome", placeholder: "Acme", required: true },
      { key: "site", label: "Site", placeholder: "https://example.com" },
      { key: "industry", label: "Segmento", placeholder: "Consultoria" },
    ], async (values) => this.entityCreator().createCompany(values, openAfterCreate), "Criar empresa").open();
  }

  // contextual = interaction launched from a card: it is born from records that
  // already exist, so the relation fields must not offer "create new".
  private openLogInteractionModal(defaults: { person?: string; company?: string; opportunity?: string } = {}, onCreated?: () => void, contextual = false): void {
    const allowCreateNew = !contextual;
    new EntityModal(this.app, "Registrar interação", [
      { key: "person", label: "Pessoa", section: "Relação", defaultValue: defaults.person, options: this.repository().names("crm/person"), allowCreateNew },
      { key: "company", label: "Empresa", section: "Relação", defaultValue: defaults.company, options: this.repository().names("crm/company"), allowCreateNew },
      { key: "opportunity", label: "Oportunidade", section: "Relação", defaultValue: defaults.opportunity, options: this.repository().listRecords("crm/opportunity").map((record) => record.basename).sort((a, b) => a.localeCompare(b)), allowCreateNew },
      { key: "date", label: "Data", section: "Interação", inputType: "date", defaultValue: new Date().toISOString().slice(0, 10) },
      { key: "kind", label: "Tipo", section: "Interação", noPlaceholderOption: true, defaultValue: "ligação", options: ["ligação", "reunião", "email", "whatsapp", "linkedin", "nota", "outro"] },
      { key: "summary", label: "Resumo", section: "Interação" },
      { key: "next_action", label: "Próxima ação", section: "Próximo passo" },
      { key: "next_action_date", label: "Data da próxima ação", section: "Próximo passo", inputType: "date" },
    ], async (values) => {
      await this.interactionCreator().createInteraction(values);
      onCreated?.();
    }, "Registrar interação").open();
  }

  // Fonte única dos campos da oportunidade (usada por criar e editar).
  private opportunityFields(defaults: Record<string, string> = {}): EntityField[] {
    return [
      { key: "name", label: "Nome da oportunidade", placeholder: "Diagnóstico operacional", required: true, defaultValue: defaults.name },
      { key: "company", label: "Empresa", required: true, options: this.repository().names("crm/company"), allowCreateNew: true, defaultValue: defaults.company },
      { key: "contact", label: "Contato", options: this.repository().names("crm/person"), allowCreateNew: true, defaultValue: defaults.contact },
      { key: "value", label: "Valor", placeholder: "15000", defaultValue: defaults.value },
      { key: "stage", label: "Etapa", options: this.pipelineStages(), defaultValue: defaults.stage || this.pipelineStages()[0], noPlaceholderOption: true },
      { key: "notes", label: "Observação", placeholder: "Notas livres sobre a oportunidade", defaultValue: defaults.notes },
    ];
  }

  private openCreateOpportunityModal(stage = "lead", openAfterCreate = true, onCreated?: () => void): void {
    new EntityModal(this.app, "Nova oportunidade", this.opportunityFields({ stage }), async (values) => {
      await this.entityCreator().createOpportunity(values, openAfterCreate);
      onCreated?.();
    }, "Criar oportunidade").open();
  }

  private openEditOpportunityModal(record: { path: string; name: string; frontmatter: Record<string, unknown> }, onEdited?: () => void): void {
    const fm = record.frontmatter;
    const defaults = {
      name: record.name,
      company: this.cleanLink(String(fm.company || "")),
      contact: this.cleanLink(String(fm.contact || "")),
      value: String(fm.value || ""),
      stage: String(fm.stage || ""),
      notes: String(fm.notes || ""),
    };
    new EntityModal(this.app, "Editar oportunidade", this.opportunityFields(defaults), async (values) => {
      const file = this.app.vault.getAbstractFileByPath(record.path);
      if (!(file instanceof TFile)) {
        new Notice("Arquivo da oportunidade não encontrado.");
        return;
      }
      const repository = this.repository();
      const newName = values.name?.trim() || record.name;
      const companyLink = repository.resolveLinkOrText("crm/company", values.company);
      await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter.name = newName;
        frontmatter.company = companyLink;
        frontmatter.contact = repository.resolveLinkOrText("crm/person", values.contact);
        frontmatter.value = values.value?.trim() || "";
        frontmatter.stage = (values.stage?.trim() || "new").toLowerCase();
        frontmatter.notes = values.notes?.trim() || "";
      });
      await this.renameOpportunityFile(file, this.cleanLink(companyLink), newName);
      new Notice(`Oportunidade atualizada: ${newName}`);
      onEdited?.();
    }, "Salvar").open();
  }

  // Renomeia o arquivo da oportunidade (Empresa - Nome) e, via fileManager,
  // o Obsidian atualiza automaticamente todos os wikilinks que a referenciam.
  private async renameOpportunityFile(file: TFile, companyLabel: string, name: string): Promise<void> {
    const desiredBase = `${safeFileName(companyLabel || "Sem empresa")} - ${safeFileName(name)}`;
    if (file.basename === desiredBase) {
      return;
    }
    const dir = file.parent?.path ?? normalizeFolderPath(this.settings.crmRoot) + "/Opportunities";
    let target = `${dir}/${desiredBase}.md`;
    let counter = 2;
    while (this.app.vault.getAbstractFileByPath(target) && target !== file.path) {
      target = `${dir}/${desiredBase} ${counter}.md`;
      counter += 1;
    }
    await this.app.fileManager.renameFile(file, target);

    // Atualiza o título H1 no corpo da nota.
    const renamed = this.app.vault.getAbstractFileByPath(target);
    if (renamed instanceof TFile) {
      const content = await this.app.vault.read(renamed);
      const updated = content.replace(/^#\s+.*$/m, `# ${desiredBase}`);
      if (updated !== content) {
        await this.app.vault.modify(renamed, updated);
      }
    }
  }

  private async ensurePipelineStages(file: { path: string }): Promise<void> {
    const abstractFile = this.app.vault.getAbstractFileByPath(file.path);
    if (!(abstractFile instanceof TFile)) {
      return;
    }

    await this.app.fileManager.processFrontMatter(abstractFile, (frontmatter) => {
      if (!Array.isArray(frontmatter.stages) || !frontmatter.stages.length) {
        frontmatter.stages = DEFAULT_PIPELINE_STAGES;
      }
    });
  }

  private pipelineStages(): string[] {
    const path = `${normalizeFolderPath(this.settings.crmRoot)}/Pipeline.md`;
    const frontmatter = this.app.metadataCache.getCache(path)?.frontmatter;
    const stages = frontmatter?.stages;
    if (Array.isArray(stages)) {
      const cleanStages = stages.map((stage) => String(stage).trim()).filter(Boolean);
      if (cleanStages.length) {
        return cleanStages;
      }
    }

    return DEFAULT_PIPELINE_STAGES;
  }

  private async openOrCreateCrm(): Promise<void> {
    // Garante a estrutura do CRM e abre a CRM Home baseada no arquivo Pipeline.md.
    await ensureCrmFolders(this.app.vault, this.settings.crmRoot);
    const file = await ensurePipelineFile(this.app.vault, this.settings);
    if (!file) {
      new Notice("Não foi possível criar CRM/Pipeline.md.");
      return;
    }

    await this.ensurePipelineStages(file);

    // Se a CRM Home já estiver aberta para este arquivo, apenas foca nela.
    const existing = this.app.workspace.getLeavesOfType(CRM_VIEW_TYPE)
      .find((leaf) => (leaf.view as { file?: { path: string } })?.file?.path === file.path);
    if (existing) {
      this.app.workspace.setActiveLeaf(existing, { focus: true });
      return;
    }

    await this.openCrmFile(file);
  }

  private async openCrmFile(file: { path: string }): Promise<void> {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({
      type: CRM_VIEW_TYPE,
      state: { file: file.path },
      active: true,
    });
  }

  private openPipelineMarkdownAsCrmView(leaf: WorkspaceLeaf): void {
    if (!(leaf.view instanceof MarkdownView)) {
      return;
    }

    const file = leaf.view.file;
    if (!file || !this.isPipelineFile(file.path)) {
      return;
    }

    window.setTimeout(async () => {
      await this.ensurePipelineStages(file);
      await this.openCrmFile(file);
    }, 0);
  }

  private isPipelineFile(path: string): boolean {
    return path === `${normalizeFolderPath(this.settings.crmRoot)}/Pipeline.md`;
  }

  private cleanLink(value: string): string {
    return value.replace(/^\[\[/, "").replace(/\]\]$/, "").trim();
  }
}
