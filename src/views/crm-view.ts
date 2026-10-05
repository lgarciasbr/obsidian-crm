import { App, FileManager, Menu, Modal, Notice, debounce, setIcon, Setting, TFile, TextFileView, Vault, WorkspaceLeaf } from "obsidian";
import { RelationshipCrmSettings, normalizeFolderPath, resolveLocale } from "../settings";
import { ensureCrmFolders } from "../crm/folders";
import { CrmRecord, CrmRepository } from "../crm/repository";

export const CRM_VIEW_TYPE = "relationship-crm";

export const DEFAULT_PIPELINE_STAGES = ["lead", "conversation", "proposal", "negotiation", "won", "lost", "paused"];

export async function ensurePipelineFile(vault: Vault, settings: RelationshipCrmSettings): Promise<TFile | null> {
  await ensureCrmFolders(vault, settings.crmRoot);

  const root = normalizeFolderPath(settings.crmRoot);
  const path = `${root}/Pipeline.md`;
  const file = vault.getAbstractFileByPath(path);
  return file instanceof TFile ? file : null;
}

type CrmTab = "pipeline" | "companies" | "contacts";

export class CrmView extends TextFileView {
  private dataValue = "";
  private stagesOverride: string[] | null = null;
  private recordStageOverrides = new Map<string, string>();
  private collapsedStages = new Set<string>();
  private collapsedLoaded = false;
  private activeTab: CrmTab = "pipeline";
  private contactsSearch = "";

  constructor(
    leaf: WorkspaceLeaf,
    private repository: CrmRepository,
    private fileManager: FileManager,
    private settings: RelationshipCrmSettings,
    private onAddOpportunity: (stage: string, onCreated?: () => void) => void,
    private onLogInteraction: (record: CrmRecord, onCreated?: () => void) => void,
    private onEditOpportunity: (record: CrmRecord, onEdited?: () => void) => void,
    private onAddPerson: () => Promise<void> | void,
    private onAddCompany: () => Promise<void> | void
  ) {
    super(leaf);
  }

  // Redesenha o board de forma segura, só depois que o metadataCache estabiliza.
  private scheduleRender = debounce(() => this.render(), 120, true);

  onload(): void {
    super.onload();
    // Reage a mudanças no cache (interações criadas, frontmatter atualizado)
    // em vez de renderizar no meio do reparse (que zerava o card).
    this.registerEvent(this.app.metadataCache.on("changed", () => this.scheduleRender()));
  }

  getViewType(): string {
    return CRM_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Relationship CRM";
  }

  getIcon(): string {
    return "layout-dashboard";
  }

  getViewData(): string {
    return this.dataValue;
  }

  setViewData(data: string, clear: boolean): void {
    this.dataValue = data;
    if (clear) {
      this.clear();
    }
    this.render();
  }

  clear(): void {
    this.contentEl.empty();
  }

  private loadCollapsedFromFrontmatter(): void {
    const collapsed = this.frontmatterList("collapsed") || [];
    this.collapsedStages = new Set(collapsed.map((item) => normalizeStage(item)));
    this.collapsedLoaded = true;
  }

  private render(): void {
    const { contentEl } = this;
    if (!this.collapsedLoaded) {
      this.loadCollapsedFromFrontmatter();
    }
    contentEl.empty();
    contentEl.addClass("relationship-crm-view");

    const navigation = contentEl.createDiv({ cls: "relationship-crm-navigation" });
    const tabs = navigation.createDiv({ cls: "relationship-crm-tabs" });
    this.renderTabs(tabs);
    const actions = navigation.createDiv({ cls: "relationship-crm-pipeline-toolbar-actions" });
    this.renderContextualActions(actions);

    if (this.activeTab === "contacts") {
      this.renderContacts(contentEl, "person");
      return;
    }

    if (this.activeTab === "companies") {
      this.renderContacts(contentEl, "company");
      return;
    }

    const opportunities = this.repository.listRecords("crm/opportunity");
    const stages = this.pipelineStages();
    const board = contentEl.createDiv({ cls: "relationship-crm-pipeline-board" });

    for (const stage of stages) {
      const column = board.createDiv({ cls: "relationship-crm-pipeline-column" });
      const isCollapsed = this.collapsedStages.has(normalizeStage(stage));
      column.toggleClass("is-collapsed", isCollapsed);
      column.draggable = true;
      column.addEventListener("dragstart", (event) => this.onColumnDragStart(event, stage));
      column.addEventListener("dragover", (event) => event.preventDefault());
      column.addEventListener("drop", async (event) => this.onPipelineDrop(event, stage));
      const records = opportunities.filter((record) => this.recordStage(record) === normalizeStage(stage));

      const header = column.createDiv({ cls: "relationship-crm-pipeline-column-header" });
      const headerLeft = header.createDiv({ cls: "relationship-crm-pipeline-column-title" });
      const grip = headerLeft.createSpan({ cls: "relationship-crm-pipeline-column-icon" });
      setIcon(grip, "grip-vertical");
      const chevron = headerLeft.createSpan({ cls: "relationship-crm-pipeline-column-icon relationship-crm-pipeline-column-chevron" });
      setIcon(chevron, isCollapsed ? "chevron-right" : "chevron-down");
      chevron.setAttr("role", "button");
      chevron.setAttr("aria-label", isCollapsed ? "Expandir etapa" : "Recolher etapa");
      chevron.setAttr("title", isCollapsed ? "Expandir etapa" : "Recolher etapa");
      chevron.addEventListener("click", (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.toggleStageCollapsed(stage);
      });
      headerLeft.createEl("span", { text: stageLabel(stage) });

      const headerRight = header.createDiv({ cls: "relationship-crm-pipeline-column-actions" });
      headerRight.createEl("span", { text: String(records.length), cls: "relationship-crm-pipeline-count" });
      const menuButton = headerRight.createEl("button", {
        cls: "relationship-crm-pipeline-column-menu",
        attr: { "aria-label": "Opções da etapa", title: "Opções da etapa" },
      });
      setIcon(menuButton, "more-vertical");
      menuButton.addEventListener("click", (event) => {
        event.stopPropagation();
        this.openStageMenu(event, stage, records.length);
      });

      const body = column.createDiv({ cls: "relationship-crm-pipeline-column-body" });

      const cards = body.createDiv({ cls: "relationship-crm-pipeline-cards" });
      cards.addEventListener("dragover", (event) => event.preventDefault());
      cards.addEventListener("drop", async (event) => this.onPipelineDrop(event, stage));
      for (const record of records.sort((a, b) => a.name.localeCompare(b.name))) {
        this.renderCard(cards, record);
      }

      const addButton = body.createDiv({ text: "+ Adicione uma oportunidade", cls: "relationship-crm-pipeline-add" });
      addButton.setAttr("role", "button");
      addButton.setAttr("tabindex", "0");
      addButton.addEventListener("click", async () => {
        this.onAddOpportunity(stage, () => this.render());
      });
      addButton.addEventListener("keydown", async (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.onAddOpportunity(stage, () => this.render());
        }
      });
    }

    const addColumn = board.createDiv({ cls: "relationship-crm-pipeline-add-column" });
    addColumn.setAttr("role", "button");
    addColumn.setAttr("tabindex", "0");
    addColumn.setText("+ Adicione uma etapa");
    addColumn.addEventListener("click", async () => this.addColumn());
    addColumn.addEventListener("keydown", async (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        await this.addColumn();
      }
    });
  }


  private renderTabs(container: HTMLElement): void {
    this.renderTabButton(container, "Pipeline", "pipeline");
    this.renderTabButton(container, "Empresas", "companies");
    this.renderTabButton(container, "Contatos", "contacts");
  }

  private renderTabButton(container: HTMLElement, label: string, tab: CrmTab): void {
    const active = this.activeTab === tab;
    const button = container.createEl("button", {
      text: label,
      cls: `relationship-crm-tab${active ? " is-active" : ""}`,
      attr: { "aria-pressed": active ? "true" : "false" },
    });
    button.addEventListener("click", () => {
      this.activeTab = tab;
      this.contactsSearch = "";
      this.render();
    });
  }

  private renderContextualActions(_container: HTMLElement): void {
    // Primary actions live inside each tab surface. Pipeline intentionally has
    // no top-level action buttons to keep the board visually focused.
  }

  private renderContacts(container: HTMLElement, kind: "person" | "company"): void {
    const content = container.createDiv({ cls: "relationship-crm-contacts" });

    const controls = content.createDiv({ cls: "relationship-crm-contacts-controls" });
    const heading = controls.createDiv({ cls: "relationship-crm-contacts-heading" });
    heading.createEl("h3", { text: kind === "person" ? "Contatos" : "Empresas" });

    const localActions = controls.createDiv({ cls: "relationship-crm-contacts-actions" });
    const search = localActions.createEl("input", {
      cls: "relationship-crm-contacts-search",
      attr: { type: "search", placeholder: kind === "person" ? "Buscar contatos..." : "Buscar empresas..." },
    });
    search.value = this.contactsSearch;
    this.renderToolbarButton(
      localActions,
      kind === "person" ? "user-plus" : "building-2",
      kind === "person" ? "Novo contato" : "Nova empresa",
      kind === "person" ? this.onAddPerson : this.onAddCompany
    );

    const table = content.createDiv({ cls: "relationship-crm-contacts-table" });
    const renderRows = () => this.renderContactRows(table, kind);
    search.addEventListener("input", () => {
      this.contactsSearch = search.value;
      renderRows();
    });
    renderRows();
  }

  private renderContactRows(table: HTMLElement, kind: "person" | "company"): void {
    table.empty();
    const contacts = this.contactViewModels();
    const query = this.contactsSearch.trim().toLowerCase();
    const filtered = contacts.filter((contact) => {
      const matchesType = contact.kind === kind;
      const matchesSearch = !query || [contact.name, contact.company, contact.nextAction, contact.email, contact.phone, contact.site, contact.industry]
        .some((value) => value.toLowerCase().includes(query));
      return matchesType && matchesSearch;
    });

    if (!filtered.length) {
      table.createDiv({ text: kind === "person" ? "Nenhum contato encontrado." : "Nenhuma empresa encontrada.", cls: "relationship-crm-empty-state" });
      return;
    }

    for (const contact of filtered) {
      if (kind === "person") {
        this.renderPersonListItem(table, contact);
      } else {
        this.renderCompanyListItem(table, contact);
      }
    }
  }

  private renderPersonListItem(container: HTMLElement, contact: ContactViewModel): void {
    const item = container.createDiv({ cls: "relationship-crm-list-item" });
    const main = item.createDiv({ cls: "relationship-crm-list-item-main" });
    const name = main.createSpan({ text: contact.name, cls: "relationship-crm-list-title relationship-crm-link" });
    name.addEventListener("click", () => this.openRecord(contact.record));

    if (contact.company) {
      const company = main.createSpan({ text: contact.company, cls: "relationship-crm-list-meta relationship-crm-link" });
      company.addEventListener("click", () => this.openRelatedRecord("crm/company", contact.company));
    }

    const details = [contact.email, contact.phone].filter(Boolean);
    if (details.length) {
      const secondary = item.createDiv({ cls: "relationship-crm-list-item-secondary" });
      for (const detail of details) {
        secondary.createSpan({ text: detail });
      }
    }
  }

  private renderCompanyListItem(container: HTMLElement, contact: ContactViewModel): void {
    const item = container.createDiv({ cls: "relationship-crm-list-item" });
    const main = item.createDiv({ cls: "relationship-crm-list-item-main" });
    const name = main.createSpan({ text: contact.name, cls: "relationship-crm-list-title relationship-crm-link" });
    name.addEventListener("click", () => this.openRecord(contact.record));
    main.createSpan({ text: `${contact.opportunityCount} oportunidade${contact.opportunityCount === 1 ? "" : "s"}`, cls: "relationship-crm-list-meta" });

    const details = [contact.site, contact.industry].filter(Boolean);
    if (details.length) {
      const secondary = item.createDiv({ cls: "relationship-crm-list-item-secondary" });
      if (contact.site) {
        const site = secondary.createSpan({ text: contact.site, cls: "relationship-crm-link" });
        site.addEventListener("click", () => window.open(contact.site, "_blank"));
      }
      if (contact.industry) {
        secondary.createSpan({ text: contact.industry });
      }
    }
  }

  private contactViewModels(): ContactViewModel[] {
    const peopleRecords = this.repository.listRecords("crm/person");
    const opportunityRecords = this.repository.listRecords("crm/opportunity");
    const people = peopleRecords.map((record) => ({
      kind: "person" as const,
      name: record.name,
      company: cleanLink(stringField(record, "company")),
      lastContact: stringField(record, "last_contact"),
      nextAction: stringField(record, "next_action"),
      email: stringField(record, "email"),
      phone: stringField(record, "phone"),
      site: "",
      industry: "",
      peopleCount: 0,
      opportunityCount: 0,
      record,
    }));
    const companies = this.repository.listRecords("crm/company").map((record) => ({
      kind: "company" as const,
      name: record.name,
      company: "",
      lastContact: stringField(record, "last_contact"),
      nextAction: stringField(record, "next_action"),
      email: "",
      phone: "",
      site: stringField(record, "site"),
      industry: stringField(record, "industry"),
      peopleCount: peopleRecords.filter((person) => cleanLink(stringField(person, "company")) === record.name).length,
      opportunityCount: opportunityRecords.filter((opportunity) => cleanLink(stringField(opportunity, "company")) === record.name).length,
      record,
    }));
    return [...people, ...companies].sort((a, b) => a.name.localeCompare(b.name));
  }

  private renderToolbarButton(container: HTMLElement, icon: string, label: string, onClick: () => void): void {
    const button = container.createEl("button", {
      cls: "relationship-crm-pipeline-toolbar-button",
      attr: { "aria-label": label, title: label },
    });
    setIcon(button, icon);
    button.createSpan({ text: label });
    button.addEventListener("click", async () => {
      await onClick();
      this.render();
    });
  }

  private openStageMenu(event: MouseEvent, stage: string, recordCount: number): void {
    const menu = new Menu();
    menu.addItem((item) =>
      item
        .setTitle("Renomear etapa")
        .setIcon("pencil")
        .onClick(() => this.renameStage(stage))
    );
    menu.addItem((item) =>
      item
        .setTitle("Excluir etapa")
        .setIcon("trash")
        .onClick(() => this.deleteStage(stage, recordCount))
    );
    menu.showAtMouseEvent(event);
  }

  private renderCard(container: HTMLElement, record: CrmRecord): void {
    const card = container.createDiv({ cls: "relationship-crm-pipeline-card" });
    card.draggable = true;
    card.addEventListener("dragstart", (event) => this.onCardDragStart(event, record));
    card.addEventListener("click", async (event) => {
      if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLButtonElement) {
        return;
      }
      await this.openRecord(record);
    });

    const company = cleanLink(stringField(record, "company"));
    const contact = cleanLink(stringField(record, "contact"));
    const value = stringField(record, "value");
    const nextAction = stringField(record, "next_action");
    const nextActionDate = stringField(record, "next_action_date");
    const notes = stringField(record, "notes");

    const titleRow = card.createDiv({ cls: "relationship-crm-pipeline-card-title-row" });
    titleRow.createEl("strong", { text: record.name, cls: "relationship-crm-pipeline-card-title" });
    const cardMenuButton = titleRow.createEl("button", {
      cls: "relationship-crm-pipeline-card-menu",
      attr: { "aria-label": "Opções do card", title: "Opções do card" },
    });
    setIcon(cardMenuButton, "more-vertical");
    cardMenuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.openCardMenu(event, record);
    });

    this.renderCardRow(card, "building-2", company, company ? () => this.openRelatedRecord("crm/company", company) : undefined);
    this.renderCardRow(card, "user", contact, contact ? () => this.openRelatedRecord("crm/person", contact) : undefined);
    this.renderCardRow(card, "circle-dollar-sign", value ? formatMoney(value, this.settings) : "");
    this.renderCardRow(card, "activity", nextAction);
    this.renderCardRow(card, "calendar-days", formatDate(nextActionDate, this.settings));
    this.renderCardRow(card, "sticky-note", notes);

    const interactionButton = card.createEl("button", {
      cls: "relationship-crm-pipeline-interaction-button",
      attr: { "aria-label": "Registrar interação", title: "Registrar interação" },
    });
    setIcon(interactionButton, "message-square-plus");
    interactionButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.onLogInteraction(record, () => this.scheduleRender());
    });
  }

  private openCardMenu(event: MouseEvent, record: CrmRecord): void {
    const menu = new Menu();
    menu.addItem((item) =>
      item
        .setTitle("Editar")
        .setIcon("pencil")
        .onClick(() => this.onEditOpportunity(record, () => this.scheduleRender()))
    );
    menu.addItem((item) =>
      item
        .setTitle("Excluir")
        .setIcon("trash")
        .onClick(() => this.confirmDeleteRecord(record))
    );
    menu.showAtMouseEvent(event);
  }

  private confirmDeleteRecord(record: CrmRecord): void {
    new ConfirmModal(
      this.app,
      "Excluir oportunidade",
      `Tem certeza que deseja excluir "${record.name}"? O arquivo vai para a lixeira.`,
      async () => {
        const file = this.app.vault.getAbstractFileByPath(record.path);
        if (file instanceof TFile) {
          await this.app.vault.trash(file, true);
          new Notice(`Excluído: ${record.name}`);
          this.scheduleRender();
        }
      }
    ).open();
  }

  private renderCardRow(card: HTMLElement, icon: string, text: string, onClick?: () => void): void {
    if (!text) {
      return;
    }
    const row = card.createDiv({ cls: `relationship-crm-pipeline-card-row${onClick ? " is-clickable" : ""}` });
    const iconEl = row.createSpan({ cls: "relationship-crm-pipeline-card-icon" });
    setIcon(iconEl, icon);
    row.createSpan({ text });
    if (onClick) {
      row.addEventListener("click", (event) => {
        event.stopPropagation();
        onClick();
      });
    }
  }

  private async openRelatedRecord(type: "crm/company" | "crm/person", name: string): Promise<void> {
    const record = this.repository.findByName(type, name);
    if (record) {
      await this.openRecord(record);
    }
  }

  private async openRecord(record: CrmRecord): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(record.path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf("tab").openFile(file);
    }
  }

  private frontmatterList(key: string): string[] | null {
    // Lê a lista direto do conteúdo do arquivo (this.dataValue), pois o
    // metadataCache pode ainda não ter parseado o arquivo ao reabrir o vault.
    const data = this.dataValue || "";
    const block = data.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (block) {
      const lines = block[1].split(/\r?\n/);
      const out: string[] = [];
      let capturing = false;
      for (const line of lines) {
        if (!capturing) {
          if (new RegExp(`^${key}\\s*:\\s*$`).test(line)) {
            capturing = true;
          }
          continue;
        }
        const item = line.match(/^\s*-\s+(.*)$/);
        if (item) {
          out.push(item[1].trim().replace(/^["']|["']$/g, ""));
        } else if (/^\S/.test(line)) {
          break;
        }
      }
      if (capturing) {
        return out;
      }
    }

    // Fallback para o cache (arquivo já indexado).
    const frontmatter = this.file ? this.app.metadataCache.getFileCache(this.file)?.frontmatter : null;
    const value = frontmatter?.[key];
    return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : null;
  }

  private pipelineStages(): string[] {
    if (this.stagesOverride?.length) {
      return this.stagesOverride;
    }

    const stages = this.frontmatterList("stages");
    if (stages && stages.length) {
      return stages.map((stage) => stage.trim()).filter(Boolean);
    }

    return DEFAULT_PIPELINE_STAGES;
  }

  private onCardDragStart(event: DragEvent, record: CrmRecord): void {
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("application/x-relationship-crm-card", record.path);
      event.dataTransfer.setData("text/plain", record.path);
    }
  }

  private async onPipelineDrop(event: DragEvent, stage: string): Promise<void> {
    const cardPath = event.dataTransfer?.getData("application/x-relationship-crm-card") || "";
    if (cardPath) {
      await this.onCardDrop(event, stage, cardPath);
      return;
    }

    await this.onColumnDrop(event, stage);
  }

  private async onCardDrop(event: DragEvent, stage: string, path: string): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const record = this.repository.listRecords("crm/opportunity").find((item) => item.path === path);
    if (record) {
      await this.updateStage(record, stage);
    }
  }

  private onColumnDragStart(event: DragEvent, stage: string): void {
    event.dataTransfer?.setData("application/x-relationship-crm-column", stage);
  }

  private async onColumnDrop(event: DragEvent, targetStage: string): Promise<void> {
    event.preventDefault();
    const sourceStage = event.dataTransfer?.getData("application/x-relationship-crm-column") || "";
    if (!sourceStage || sourceStage === targetStage || !this.file) {
      return;
    }

    const stages = this.pipelineStages();
    const sourceIndex = stages.indexOf(sourceStage);
    const targetIndex = stages.indexOf(targetStage);
    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const reordered = [...stages];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    this.stagesOverride = reordered;
    await this.updatePipelineFrontmatter((frontmatter) => {
      frontmatter.stages = reordered;
    });
    this.render();
  }

  private async renameStage(stage: string): Promise<void> {
    if (!this.file) {
      return;
    }

    new PipelineStageModal(this.app, async (label) => {
      const nextLabel = label.trim();
      if (!nextLabel || normalizeStage(nextLabel) === normalizeStage(stage)) {
        return;
      }

      const stages = this.pipelineStages();
      if (stages.some((item) => normalizeStage(item) === normalizeStage(nextLabel))) {
        new Notice("Esta etapa já existe.");
        return;
      }

      const nextStage = normalizeStage(nextLabel);
      const nextStages = stages.map((item) => item === stage ? nextLabel : item);
      this.stagesOverride = nextStages;
      await this.updatePipelineFrontmatter((frontmatter) => {
        frontmatter.stages = nextStages;
      });

      const opportunities = this.repository.listRecords("crm/opportunity")
        .filter((record) => this.recordStage(record) === normalizeStage(stage));
      const failed: string[] = [];
      for (const record of opportunities) {
        const file = this.app.vault.getAbstractFileByPath(record.path);
        if (!(file instanceof TFile)) {
          failed.push(record.name);
          continue;
        }
        try {
          await this.fileManager.processFrontMatter(file, (frontmatter) => {
            frontmatter.stage = nextStage;
          });
          this.recordStageOverrides.set(record.path, nextStage);
        } catch (_error) {
          failed.push(record.name);
        }
      }

      if (failed.length) {
        new Notice(`Etapa renomeada, mas falhou em: ${failed.join(", ")}`);
      }
      this.render();
    }, stageLabel(stage)).open();
  }

  private async deleteStage(stage: string, recordCount: number): Promise<void> {
    if (!this.file) {
      return;
    }

    if (recordCount > 0) {
      new Notice("Esta etapa tem oportunidades. Mova as oportunidades antes de excluir.");
      return;
    }

    const stages = this.pipelineStages().filter((item) => item !== stage);
    this.stagesOverride = stages;
    await this.updatePipelineFrontmatter((frontmatter) => {
      frontmatter.stages = stages;
    });
    this.render();
  }

  private async addColumn(): Promise<void> {
    if (!this.file) {
      return;
    }

    new PipelineStageModal(this.app, async (label) => {
      const nextLabel = label.trim();
      if (!nextLabel) {
        return;
      }

      const stages = this.pipelineStages();
      if (stages.some((item) => normalizeStage(item) === normalizeStage(nextLabel))) {
        new Notice("Esta etapa já existe.");
        return;
      }

      const nextStages = [...stages, nextLabel];
      this.stagesOverride = nextStages;
      await this.updatePipelineFrontmatter((frontmatter) => {
        frontmatter.stages = nextStages;
      });
      this.render();
    }).open();
  }

  private async toggleStageCollapsed(stage: string): Promise<void> {
    const key = normalizeStage(stage);
    if (this.collapsedStages.has(key)) {
      this.collapsedStages.delete(key);
    } else {
      this.collapsedStages.add(key);
    }
    if (this.file) {
      const collapsed = [...this.collapsedStages];
      await this.updatePipelineFrontmatter((frontmatter) => {
        if (collapsed.length) {
          frontmatter.collapsed = collapsed;
        } else {
          delete frontmatter.collapsed;
        }
      });
    }
    this.render();
  }

  private recordStage(record: CrmRecord): string {
    return normalizeStage(this.recordStageOverrides.get(record.path) || stringField(record, "stage"));
  }

  private async updatePipelineFrontmatter(update: (frontmatter: Record<string, unknown>) => void): Promise<void> {
    if (!this.file) {
      return;
    }

    await this.fileManager.processFrontMatter(this.file, update);
    this.dataValue = await this.app.vault.read(this.file);
  }

  private async updateStage(record: CrmRecord, stage: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(record.path);
    if (!(file instanceof TFile)) {
      return;
    }

    await this.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.stage = normalizeStage(stage);
    });
    this.recordStageOverrides.set(record.path, normalizeStage(stage));
    this.render();
  }
}

interface ContactViewModel {
  kind: "person" | "company";
  name: string;
  company: string;
  lastContact: string;
  nextAction: string;
  email: string;
  phone: string;
  site: string;
  industry: string;
  peopleCount: number;
  opportunityCount: number;
  record: CrmRecord;
}

class PipelineStageModal extends Modal {
  private value = "";

  constructor(app: App, private onSubmit: (label: string) => Promise<void>, private initialValue = "") {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.value = this.initialValue;
    contentEl.createEl("h2", { text: this.initialValue ? "Renomear etapa" : "Nova etapa" });

    new Setting(contentEl)
      .setName("Nome da etapa")
      .addText((text) => {
        text.setPlaceholder("Ex.: Qualificação");
        text.setValue(this.initialValue);
        text.onChange((value) => {
          this.value = value;
        });
      });

    new Setting(contentEl)
      .addButton((button) =>
        button
          .setButtonText(this.initialValue ? "Renomear etapa" : "Criar etapa")
          .setCta()
          .onClick(async () => {
            if (!this.value.trim()) {
              new Notice("Nome da etapa é obrigatório.");
              return;
            }

            await this.onSubmit(this.value);
            this.close();
          })
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

class ConfirmModal extends Modal {
  constructor(
    app: App,
    private titleText: string,
    private message: string,
    private onConfirm: () => Promise<void> | void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.titleText });
    contentEl.createEl("p", { text: this.message });

    new Setting(contentEl)
      .addButton((button) =>
        button.setButtonText("Cancelar").onClick(() => this.close())
      )
      .addButton((button) =>
        button
          .setButtonText("Excluir")
          .setWarning()
          .onClick(async () => {
            await this.onConfirm();
            this.close();
          })
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

function stageLabel(stage: string): string {
  // Mostra o rótulo exatamente como está no Pipeline.md (como o usuário criou).
  return stage;
}

function stringField(record: CrmRecord, field: string): string {
  const value = record.frontmatter[field];
  if (typeof value === "string") {
    return value.trim();
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
}

function normalizeStage(stage: string): string {
  const normalized = stage.trim().toLowerCase();
  return normalized || "lead";
}

function cleanLink(value: string): string {
  return value.replace(/^\[\[/, "").replace(/\]\]$/, "").trim();
}

function formatMoney(value: string, settings: RelationshipCrmSettings): string {
  if (!value) {
    return "Valor";
  }

  const number = Number(value.replace(/[^\d,.-]/g, "").replace(".", "").replace(",", "."));
  if (Number.isNaN(number)) {
    return value;
  }

  const currency = (settings.defaultCurrency || "BRL").toUpperCase();
  try {
    return new Intl.NumberFormat(resolveLocale(settings), { style: "currency", currency }).format(number);
  } catch (_error) {
    return `${currency} ${number}`;
  }
}

// Storage stays ISO (YYYY-MM-DD); only the on-card display is localized.
function formatDate(iso: string, settings: RelationshipCrmSettings): string {
  const clean = (iso || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  const [y, m, d] = clean.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  try {
    return new Intl.DateTimeFormat(resolveLocale(settings), { timeZone: "UTC" }).format(date);
  } catch (_error) {
    return clean;
  }
}
