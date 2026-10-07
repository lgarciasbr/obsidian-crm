import { App, FileManager, Menu, Modal, Notice, debounce, setIcon, Setting, TFile, TextFileView, Vault, WorkspaceLeaf } from "obsidian";
import { CrmSettings, normalizeFolderPath, resolveLocale } from "../settings";
import { ensureCrmFolders } from "../crm/folders";
import { CrmRecord, CrmRepository } from "../crm/repository";
import { DEFAULT_STAGES } from "../crm/integrity";
import { safeExternalUrl } from "../crm/urls";
import { addStage, formatDate, formatMoney, frontmatterList, moveStage, normalizeStage, pruneCardOrder, removeStage, renameStage, reorderCard, sortCards } from "../crm/pipeline";

export const CRM_VIEW_TYPE = "crm-view";

export async function ensurePipelineFile(vault: Vault, settings: CrmSettings): Promise<TFile | null> {
  await ensureCrmFolders(vault, settings);

  const root = normalizeFolderPath(settings.crmRoot);
  const path = `${root}/Pipeline.md`;
  const file = vault.getAbstractFileByPath(path);
  return file instanceof TFile ? file : null;
}

type CrmTab = "pipeline" | "companies" | "contacts";

export class CrmView extends TextFileView {
  private dataValue = "";
  private stagesOverride: string[] | null = null;
  private cardOrderOverride: string[] | null = null;
  private recordStageOverrides = new Map<string, string>();
  private collapsedStages = new Set<string>();
  private collapsedLoaded = false;
  private activeTab: CrmTab = "pipeline";
  private contactsSearch = "";

  constructor(
    leaf: WorkspaceLeaf,
    private repository: CrmRepository,
    private fileManager: FileManager,
    private settings: CrmSettings,
    private onAddOpportunity: (stage: string, onCreated?: () => void) => void,
    private onLogInteraction: (record: CrmRecord, onCreated?: () => void) => void,
    private onEditOpportunity: (record: CrmRecord, onEdited?: () => void) => void,
    private onAddPerson: () => Promise<void> | void,
    private onAddCompany: () => Promise<void> | void
  ) {
    super(leaf);
  }

  // Redraw the board safely, only after the metadataCache settles.
  private scheduleRender = debounce(() => this.render(), 120, true);

  onload(): void {
    super.onload();
    // React to cache changes (interactions created, frontmatter updated)
    // instead of rendering mid-reparse (which used to blank the card).
    this.registerEvent(this.app.metadataCache.on("changed", () => this.scheduleRender()));
  }

  getViewType(): string {
    return CRM_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "CRM";
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
    contentEl.addClass("crm-view");

    const navigation = contentEl.createDiv({ cls: "crm-navigation" });
    const tabs = navigation.createDiv({ cls: "crm-tabs" });
    this.renderTabs(tabs);
    const actions = navigation.createDiv({ cls: "crm-pipeline-toolbar-actions" });
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
    const board = contentEl.createDiv({ cls: "crm-pipeline-board" });

    for (const stage of stages) {
      const column = board.createDiv({ cls: "crm-pipeline-column" });
      const isCollapsed = this.collapsedStages.has(normalizeStage(stage));
      column.toggleClass("is-collapsed", isCollapsed);
      column.draggable = true;
      column.addEventListener("dragstart", (event) => this.onColumnDragStart(event, stage));
      column.addEventListener("dragover", (event) => event.preventDefault());
      column.addEventListener("drop", async (event) => this.onPipelineDrop(event, stage));
      const records = opportunities.filter((record) => this.recordStage(record) === normalizeStage(stage));

      const header = column.createDiv({ cls: "crm-pipeline-column-header" });
      const headerLeft = header.createDiv({ cls: "crm-pipeline-column-title" });
      const grip = headerLeft.createSpan({ cls: "crm-pipeline-column-icon" });
      setIcon(grip, "grip-vertical");
      const chevron = headerLeft.createSpan({ cls: "crm-pipeline-column-icon crm-pipeline-column-chevron" });
      setIcon(chevron, isCollapsed ? "chevron-right" : "chevron-down");
      chevron.setAttr("role", "button");
      chevron.setAttr("aria-label", isCollapsed ? "Expand stage" : "Collapse stage");
      chevron.setAttr("title", isCollapsed ? "Expand stage" : "Collapse stage");
      chevron.addEventListener("click", (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.toggleStageCollapsed(stage);
      });
      headerLeft.createEl("span", { text: stageLabel(stage) });

      const headerRight = header.createDiv({ cls: "crm-pipeline-column-actions" });
      headerRight.createEl("span", { text: String(records.length), cls: "crm-pipeline-count" });
      const menuButton = headerRight.createEl("button", {
        cls: "crm-pipeline-column-menu",
        attr: { "aria-label": "Stage options", title: "Stage options" },
      });
      setIcon(menuButton, "more-vertical");
      menuButton.addEventListener("click", (event) => {
        event.stopPropagation();
        this.openStageMenu(event, stage, records.length);
      });

      const body = column.createDiv({ cls: "crm-pipeline-column-body" });

      const cards = body.createDiv({ cls: "crm-pipeline-cards" });
      cards.addEventListener("dragover", (event) => event.preventDefault());
      cards.addEventListener("drop", async (event) => this.onPipelineDrop(event, stage));
      for (const record of this.sortedCards(records)) {
        this.renderCard(cards, record, stage);
      }

      const addButton = body.createDiv({ text: "+ Add an opportunity", cls: "crm-pipeline-add" });
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

    const addColumn = board.createDiv({ cls: "crm-pipeline-add-column" });
    addColumn.setAttr("role", "button");
    addColumn.setAttr("tabindex", "0");
    addColumn.setText("+ Add a stage");
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
    this.renderTabButton(container, "Companies", "companies");
    this.renderTabButton(container, "Contacts", "contacts");
  }

  private renderTabButton(container: HTMLElement, label: string, tab: CrmTab): void {
    const active = this.activeTab === tab;
    const button = container.createEl("button", {
      text: label,
      cls: `crm-tab${active ? " is-active" : ""}`,
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
    const content = container.createDiv({ cls: "crm-contacts" });

    const controls = content.createDiv({ cls: "crm-contacts-controls" });
    const heading = controls.createDiv({ cls: "crm-contacts-heading" });
    heading.createEl("h3", { text: kind === "person" ? "Contacts" : "Companies" });

    const localActions = controls.createDiv({ cls: "crm-contacts-actions" });
    const search = localActions.createEl("input", {
      cls: "crm-contacts-search",
      attr: { type: "search", placeholder: kind === "person" ? "Search contacts..." : "Search companies..." },
    });
    search.value = this.contactsSearch;
    this.renderToolbarButton(
      localActions,
      kind === "person" ? "user" : "building-2",
      kind === "person" ? "New contact" : "New company",
      kind === "person" ? this.onAddPerson : this.onAddCompany
    );

    const table = content.createDiv({ cls: "crm-contacts-table" });
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
      table.createDiv({ text: kind === "person" ? "No contacts found." : "No companies found.", cls: "crm-empty-state" });
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
    const item = container.createDiv({ cls: "crm-list-item" });
    const main = item.createDiv({ cls: "crm-list-item-main" });
    const name = main.createSpan({ text: contact.name, cls: "crm-list-title crm-link" });
    name.addEventListener("click", () => this.openRecord(contact.record));

    if (contact.company) {
      const company = main.createSpan({ text: contact.company, cls: "crm-list-meta crm-link" });
      company.addEventListener("click", () => this.openRelatedRecord("crm/company", contact.company));
    }

    const details = [contact.email, contact.phone].filter(Boolean);
    if (details.length) {
      const secondary = item.createDiv({ cls: "crm-list-item-secondary" });
      for (const detail of details) {
        secondary.createSpan({ text: detail });
      }
    }
  }

  private renderCompanyListItem(container: HTMLElement, contact: ContactViewModel): void {
    const item = container.createDiv({ cls: "crm-list-item" });
    const main = item.createDiv({ cls: "crm-list-item-main" });
    const name = main.createSpan({ text: contact.name, cls: "crm-list-title crm-link" });
    name.addEventListener("click", () => this.openRecord(contact.record));
    main.createSpan({ text: `${contact.opportunityCount} opportunit${contact.opportunityCount === 1 ? "y" : "ies"}`, cls: "crm-list-meta" });

    const details = [contact.site, contact.industry].filter(Boolean);
    if (details.length) {
      const secondary = item.createDiv({ cls: "crm-list-item-secondary" });
      const siteUrl = safeExternalUrl(contact.site);
      if (contact.site && siteUrl) {
        const site = secondary.createSpan({ text: contact.site, cls: "crm-link" });
        site.addEventListener("click", () => window.open(siteUrl, "_blank", "noopener"));
      } else if (contact.site) {
        secondary.createSpan({ text: contact.site });
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
      cls: "crm-pipeline-toolbar-button",
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
        .setTitle("Rename stage")
        .setIcon("pencil")
        .onClick(() => this.renameStage(stage))
    );
    menu.addItem((item) =>
      item
        .setTitle("Delete stage")
        .setIcon("trash")
        .onClick(() => this.deleteStage(stage, recordCount))
    );
    menu.showAtMouseEvent(event);
  }

  private renderCard(container: HTMLElement, record: CrmRecord, stage: string): void {
    const card = container.createDiv({ cls: "crm-pipeline-card" });
    card.draggable = true;
    card.dataset.cardId = cardId(record);
    card.addEventListener("dragstart", (event) => this.onCardDragStart(event, record));
    card.addEventListener("dragover", (event) => {
      if (!event.dataTransfer?.types.includes("application/x-crm-card")) {
        return;
      }
      event.preventDefault();
      const before = dropsBefore(card, event);
      card.toggleClass("is-drop-before", before);
      card.toggleClass("is-drop-after", !before);
    });
    card.addEventListener("dragleave", () => card.removeClasses(["is-drop-before", "is-drop-after"]));
    card.addEventListener("drop", async (event) => {
      card.removeClasses(["is-drop-before", "is-drop-after"]);
      const path = event.dataTransfer?.getData("application/x-crm-card") || "";
      if (!path) {
        return;
      }
      const next = card.nextElementSibling instanceof HTMLElement ? card.nextElementSibling.dataset.cardId ?? null : null;
      await this.onCardDrop(event, stage, path, dropsBefore(card, event) ? cardId(record) : next);
    });
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

    const titleRow = card.createDiv({ cls: "crm-pipeline-card-title-row" });
    titleRow.createEl("strong", { text: record.name, cls: "crm-pipeline-card-title" });
    const actions = titleRow.createDiv({ cls: "crm-pipeline-card-actions" });
    const interactionButton = actions.createEl("button", {
      cls: "crm-pipeline-card-action crm-pipeline-interaction-button",
      attr: { "aria-label": "Log interaction", title: "Log interaction" },
    });
    setIcon(interactionButton, "message-square-plus");
    interactionButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.onLogInteraction(record, () => this.scheduleRender());
    });
    const cardMenuButton = actions.createEl("button", {
      cls: "crm-pipeline-card-action",
      attr: { "aria-label": "Card options", title: "Card options" },
    });
    setIcon(cardMenuButton, "more-vertical");
    cardMenuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.openCardMenu(event, record);
    });

    this.renderCardRow(card, "building-2", company, company ? () => this.openRelatedRecord("crm/company", company) : undefined);
    this.renderCardRow(card, "user", contact, contact ? () => this.openRelatedRecord("crm/person", contact) : undefined);
    this.renderCardRow(card, "circle-dollar-sign", value ? formatMoney(value, this.settings.defaultCurrency, resolveLocale(this.settings)) : "");
    this.renderCardRow(card, "activity", nextAction);
    this.renderCardRow(card, "calendar-days", formatDate(nextActionDate, resolveLocale(this.settings)));
    this.renderCardRow(card, "sticky-note", notes);
  }

  private openCardMenu(event: MouseEvent, record: CrmRecord): void {
    const menu = new Menu();
    menu.addItem((item) =>
      item
        .setTitle("Edit")
        .setIcon("pencil")
        .onClick(() => this.onEditOpportunity(record, () => this.scheduleRender()))
    );
    menu.addItem((item) =>
      item
        .setTitle("Delete")
        .setIcon("trash")
        .onClick(() => this.confirmDeleteRecord(record))
    );
    menu.showAtMouseEvent(event);
  }

  private confirmDeleteRecord(record: CrmRecord): void {
    new ConfirmModal(
      this.app,
      "Delete opportunity",
      `Delete "${record.name}"? The file will be moved to the trash.`,
      async () => {
        const file = this.app.vault.getAbstractFileByPath(record.path);
        if (file instanceof TFile) {
          await this.app.vault.trash(file, true);
          new Notice(`Deleted: ${record.name}`);
          this.scheduleRender();
        }
      }
    ).open();
  }

  private renderCardRow(card: HTMLElement, icon: string, text: string, onClick?: () => void): void {
    if (!text) {
      return;
    }
    const row = card.createDiv({ cls: `crm-pipeline-card-row${onClick ? " is-clickable" : ""}` });
    const iconEl = row.createSpan({ cls: "crm-pipeline-card-icon" });
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
    // Read the list straight from the file content (this.dataValue): the
    // metadataCache may not have parsed the file yet when the vault reopens.
    const fromContent = frontmatterList(this.dataValue || "", key);
    if (fromContent) {
      return fromContent;
    }

    // Fall back to the cache (file already indexed).
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

    return [...DEFAULT_STAGES];
  }

  private onCardDragStart(event: DragEvent, record: CrmRecord): void {
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("application/x-crm-card", record.path);
      event.dataTransfer.setData("text/plain", record.path);
    }
  }

  private async onPipelineDrop(event: DragEvent, stage: string): Promise<void> {
    const cardPath = event.dataTransfer?.getData("application/x-crm-card") || "";
    if (cardPath) {
      await this.onCardDrop(event, stage, cardPath, null);
      return;
    }

    await this.onColumnDrop(event, stage);
  }

  // Drops a card into `stage`, before the card `beforeId` or at the end of
  // the column, saving the new manual order in Pipeline.md.
  private async onCardDrop(event: DragEvent, stage: string, path: string, beforeId: string | null): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const opportunities = this.repository.listRecords("crm/opportunity");
    const record = opportunities.find((item) => item.path === path);
    if (!record) {
      return;
    }

    const column = this.sortedCards(opportunities.filter((item) => this.recordStage(item) === normalizeStage(stage))).map(cardId);
    const order = pruneCardOrder(reorderCard(this.cardOrder(), column, cardId(record), beforeId), opportunities.map(cardId));
    this.cardOrderOverride = order;
    if (this.recordStage(record) !== normalizeStage(stage)) {
      await this.saveStage(record, stage);
    }
    await this.updatePipelineFrontmatter((frontmatter) => {
      frontmatter.card_order = order;
    });
    this.render();
  }

  private cardOrder(): string[] {
    return this.cardOrderOverride ?? this.frontmatterList("card_order") ?? [];
  }

  private sortedCards(records: CrmRecord[]): CrmRecord[] {
    return sortCards(records.map((record) => ({ id: cardId(record), name: record.name, record })), this.cardOrder())
      .map((item) => item.record);
  }

  private onColumnDragStart(event: DragEvent, stage: string): void {
    event.dataTransfer?.setData("application/x-crm-column", stage);
  }

  private async onColumnDrop(event: DragEvent, targetStage: string): Promise<void> {
    event.preventDefault();
    const sourceStage = event.dataTransfer?.getData("application/x-crm-column") || "";
    if (!sourceStage || sourceStage === targetStage || !this.file) {
      return;
    }

    const reordered = moveStage(this.pipelineStages(), sourceStage, targetStage);

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
      const result = renameStage(this.pipelineStages(), stage, label);
      if ("error" in result) {
        if (result.error === "exists") {
          new Notice("This stage already exists.");
        }
        return;
      }

      const nextStage = result.to;
      this.stagesOverride = result.stages;
      await this.updatePipelineFrontmatter((frontmatter) => {
        frontmatter.stages = result.stages;
      });

      const opportunities = this.repository.listRecords("crm/opportunity")
        .filter((record) => this.recordStage(record) === result.from);
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
        new Notice(`Stage renamed, but failed for: ${failed.join(", ")}`);
      }
      this.render();
    }, stageLabel(stage)).open();
  }

  private async deleteStage(stage: string, recordCount: number): Promise<void> {
    if (!this.file) {
      return;
    }

    if (recordCount > 0) {
      new Notice("This stage has opportunities. Move them before deleting the stage.");
      return;
    }

    const stages = removeStage(this.pipelineStages(), stage);
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
      const result = addStage(this.pipelineStages(), label);
      if ("error" in result) {
        if (result.error === "exists") {
          new Notice("This stage already exists.");
        }
        return;
      }

      const nextStages = result.stages;
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

  private async saveStage(record: CrmRecord, stage: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(record.path);
    if (!(file instanceof TFile)) {
      return;
    }

    await this.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.stage = normalizeStage(stage);
    });
    this.recordStageOverrides.set(record.path, normalizeStage(stage));
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
    contentEl.createEl("h2", { text: this.initialValue ? "Rename stage" : "New stage" });

    new Setting(contentEl)
      .setName("Stage name")
      .addText((text) => {
        text.setPlaceholder("e.g. Qualified");
        text.setValue(this.initialValue);
        text.onChange((value) => {
          this.value = value;
        });
      });

    new Setting(contentEl)
      .addButton((button) =>
        button
          .setButtonText(this.initialValue ? "Rename stage" : "Create stage")
          .setCta()
          .onClick(async () => {
            if (!this.value.trim()) {
              new Notice("Stage name is required.");
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
        button.setButtonText("Cancel").onClick(() => this.close())
      )
      .addButton((button) =>
        button
          .setButtonText("Delete")
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
  // Show the label exactly as written in Pipeline.md (as the user created it).
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

function cleanLink(value: string): string {
  return value.replace(/^\[\[/, "").replace(/\]\]$/, "").trim();
}

// Stable identity of a card in the manual order: crm_id, which survives renames.
function cardId(record: CrmRecord): string {
  return stringField(record, "crm_id") || record.path;
}

function dropsBefore(card: HTMLElement, event: DragEvent): boolean {
  const rect = card.getBoundingClientRect();
  return event.clientY < rect.top + rect.height / 2;
}
