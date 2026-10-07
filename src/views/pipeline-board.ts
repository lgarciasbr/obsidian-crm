import { App, FileManager, Menu, Notice, setIcon, TFile } from "obsidian";
import { CrmSettings, resolveLocale } from "../settings";
import { CrmRecord, CrmRepository } from "../crm/repository";
import { DEFAULT_STAGES } from "../crm/integrity";
import { cleanLink } from "../crm/links";
import { Frontmatter, listValue } from "../crm/values";
import { addStage, formatDate, formatMoney, frontmatterList, moveStage, normalizeStage, pruneCardOrder, removeStage, renameStage, reorderCard, sortCards } from "../crm/pipeline";
import { ConfirmModal, PipelineStageModal } from "./modals";
import { cardId, recordText } from "./records";
import type { CrmViewActions } from "./crm-view";

// What the board needs from the view that hosts it.
export interface BoardHost {
  readonly app: App;
  readonly file: TFile | null;
  data: string;
  readonly repository: CrmRepository;
  readonly fileManager: FileManager;
  readonly settings: CrmSettings;
  readonly actions: CrmViewActions;
  render(): void;
  scheduleRender(): void;
  openRecord(record: CrmRecord): Promise<void>;
  openRelatedRecord(type: "crm/company" | "crm/person", name: string): Promise<void>;
}

// The pipeline tab: columns from Pipeline.md stages, cards from opportunities,
// drag and drop, and stage management. Board state is saved in Pipeline.md.
export class PipelineBoard {
  private stagesOverride: string[] | null = null;
  private cardOrderOverride: string[] | null = null;
  private recordStageOverrides = new Map<string, string>();
  private collapsedStages = new Set<string>();
  private collapsedLoaded = false;

  constructor(private host: BoardHost) {}

  render(contentEl: HTMLElement): void {
    if (!this.collapsedLoaded) {
      this.loadCollapsedFromFrontmatter();
    }
    const opportunities = this.host.repository.listRecords("crm/opportunity");
    const stages = this.pipelineStages();
    const board = contentEl.createDiv({ cls: "crm-pipeline-board" });

    for (const stage of stages) {
      const column = board.createDiv({ cls: "crm-pipeline-column" });
      const isCollapsed = this.collapsedStages.has(normalizeStage(stage));
      column.toggleClass("is-collapsed", isCollapsed);
      column.draggable = true;
      column.addEventListener("dragstart", (event) => this.onColumnDragStart(event, stage));
      column.addEventListener("dragover", (event) => event.preventDefault());
      column.addEventListener("drop", (event) => void this.onPipelineDrop(event, stage));
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
        void this.toggleStageCollapsed(stage);
      });
      headerLeft.createSpan({ text: stageLabel(stage) });

      const headerRight = header.createDiv({ cls: "crm-pipeline-column-actions" });
      headerRight.createSpan({ text: String(records.length), cls: "crm-pipeline-count" });
      const menuButton = headerRight.createEl("button", {
        cls: "clickable-icon crm-pipeline-column-menu",
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
      cards.addEventListener("drop", (event) => void this.onPipelineDrop(event, stage));
      for (const record of this.sortedCards(records)) {
        this.renderCard(cards, record, stage);
      }

      const addButton = body.createDiv({ text: "+ Add an opportunity", cls: "crm-pipeline-add" });
      addButton.setAttr("role", "button");
      addButton.setAttr("tabindex", "0");
      addButton.addEventListener("click", () => {
        this.host.actions.addOpportunity(stage, () => this.host.render());
      });
      addButton.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.host.actions.addOpportunity(stage, () => this.host.render());
        }
      });
    }

    const addColumn = board.createDiv({ cls: "crm-pipeline-add-column" });
    addColumn.setAttr("role", "button");
    addColumn.setAttr("tabindex", "0");
    addColumn.setText("+ Add a stage");
    addColumn.addEventListener("click", () => void this.addColumn());
    addColumn.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        void this.addColumn();
      }
    });
  }

  private loadCollapsedFromFrontmatter(): void {
    const collapsed = this.frontmatterList("collapsed") || [];
    this.collapsedStages = new Set(collapsed.map((item) => normalizeStage(item)));
    this.collapsedLoaded = true;
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
    card.addEventListener("drop", (event) => {
      card.removeClasses(["is-drop-before", "is-drop-after"]);
      const path = event.dataTransfer?.getData("application/x-crm-card") || "";
      if (!path) {
        return;
      }
      const next = card.nextElementSibling instanceof HTMLElement ? card.nextElementSibling.dataset.cardId ?? null : null;
      void this.onCardDrop(event, stage, path, dropsBefore(card, event) ? cardId(record) : next);
    });
    card.addEventListener("click", (event) => {
      if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLButtonElement) {
        return;
      }
      void this.host.openRecord(record);
    });

    const company = cleanLink(recordText(record, "company"));
    const contact = cleanLink(recordText(record, "contact"));
    const value = recordText(record, "value");
    const nextAction = recordText(record, "next_action");
    const nextActionDate = recordText(record, "next_action_date");
    const notes = recordText(record, "notes");

    const titleRow = card.createDiv({ cls: "crm-pipeline-card-title-row" });
    titleRow.createEl("strong", { text: record.name, cls: "crm-pipeline-card-title" });
    const actions = titleRow.createDiv({ cls: "crm-pipeline-card-actions" });
    const interactionButton = actions.createEl("button", {
      cls: "clickable-icon crm-pipeline-card-action crm-pipeline-interaction-button",
      attr: { "aria-label": "Log interaction", title: "Log interaction" },
    });
    setIcon(interactionButton, "message-square-plus");
    interactionButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.host.actions.logInteraction(record, () => this.host.scheduleRender());
    });
    const cardMenuButton = actions.createEl("button", {
      cls: "clickable-icon crm-pipeline-card-action",
      attr: { "aria-label": "Card options", title: "Card options" },
    });
    setIcon(cardMenuButton, "more-vertical");
    cardMenuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.openCardMenu(event, record);
    });

    this.renderCardRow(card, "building-2", company, company ? () => void this.host.openRelatedRecord("crm/company", company) : undefined);
    this.renderCardRow(card, "user", contact, contact ? () => void this.host.openRelatedRecord("crm/person", contact) : undefined);
    this.renderCardRow(card, "circle-dollar-sign", value ? formatMoney(value, this.host.settings.defaultCurrency, resolveLocale(this.host.settings)) : "");
    this.renderCardRow(card, "activity", nextAction);
    this.renderCardRow(card, "calendar-days", formatDate(nextActionDate, resolveLocale(this.host.settings)));
    this.renderCardRow(card, "sticky-note", notes);
  }

  private openCardMenu(event: MouseEvent, record: CrmRecord): void {
    const menu = new Menu();
    menu.addItem((item) =>
      item
        .setTitle("Edit")
        .setIcon("pencil")
        .onClick(() => this.host.actions.editOpportunity(record, () => this.host.scheduleRender()))
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
      this.host.app,
      "Delete opportunity",
      `Delete "${record.name}"? The file will be moved to the trash.`,
      async () => {
        await this.host.actions.deleteOpportunity(record);
        this.cardOrderOverride = this.cardOrderOverride?.filter((id) => id !== cardId(record)) ?? null;
        new Notice(`Deleted: ${record.name}`);
        this.host.scheduleRender();
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

  private frontmatterList(key: string): string[] | null {
    // Read the list straight from the file content (this.host.data): the
    // metadataCache may not have parsed the file yet when the vault reopens.
    const fromContent = frontmatterList(this.host.data || "", key);
    if (fromContent) {
      return fromContent;
    }

    // Fall back to the cache (file already indexed).
    const frontmatter: Frontmatter | undefined = this.host.file ? this.host.app.metadataCache.getFileCache(this.host.file)?.frontmatter : undefined;
    const value = frontmatter?.[key];
    return Array.isArray(value) ? listValue(value) : null;
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
    const opportunities = this.host.repository.listRecords("crm/opportunity");
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
    this.host.render();
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
    if (!sourceStage || sourceStage === targetStage || !this.host.file) {
      return;
    }

    const reordered = moveStage(this.pipelineStages(), sourceStage, targetStage);

    this.stagesOverride = reordered;
    await this.updatePipelineFrontmatter((frontmatter) => {
      frontmatter.stages = reordered;
    });
    this.host.render();
  }

  private async renameStage(stage: string): Promise<void> {
    if (!this.host.file) {
      return;
    }

    new PipelineStageModal(this.host.app, async (label) => {
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

      const opportunities = this.host.repository.listRecords("crm/opportunity")
        .filter((record) => this.recordStage(record) === result.from);
      const failed: string[] = [];
      for (const record of opportunities) {
        const file = this.host.app.vault.getAbstractFileByPath(record.path);
        if (!(file instanceof TFile)) {
          failed.push(record.name);
          continue;
        }
        try {
          await this.host.fileManager.processFrontMatter(file, (frontmatter: Frontmatter) => {
            frontmatter.stage = nextStage;
          });
          this.recordStageOverrides.set(record.path, nextStage);
        } catch {
          failed.push(record.name);
        }
      }

      if (failed.length) {
        new Notice(`Stage renamed, but failed for: ${failed.join(", ")}`);
      }
      this.host.render();
    }, stageLabel(stage)).open();
  }

  private async deleteStage(stage: string, recordCount: number): Promise<void> {
    if (!this.host.file) {
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
    this.host.render();
  }

  private async addColumn(): Promise<void> {
    if (!this.host.file) {
      return;
    }

    new PipelineStageModal(this.host.app, async (label) => {
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
      this.host.render();
    }).open();
  }

  private async toggleStageCollapsed(stage: string): Promise<void> {
    const key = normalizeStage(stage);
    if (this.collapsedStages.has(key)) {
      this.collapsedStages.delete(key);
    } else {
      this.collapsedStages.add(key);
    }
    if (this.host.file) {
      const collapsed = [...this.collapsedStages];
      await this.updatePipelineFrontmatter((frontmatter) => {
        if (collapsed.length) {
          frontmatter.collapsed = collapsed;
        } else {
          delete frontmatter.collapsed;
        }
      });
    }
    this.host.render();
  }

  private recordStage(record: CrmRecord): string {
    return normalizeStage(this.recordStageOverrides.get(record.path) || recordText(record, "stage"));
  }

  private async updatePipelineFrontmatter(update: (frontmatter: Record<string, unknown>) => void): Promise<void> {
    if (!this.host.file) {
      return;
    }

    await this.host.fileManager.processFrontMatter(this.host.file, update);
    this.host.data = await this.host.app.vault.read(this.host.file);
  }

  private async saveStage(record: CrmRecord, stage: string): Promise<void> {
    const file = this.host.app.vault.getAbstractFileByPath(record.path);
    if (!(file instanceof TFile)) {
      return;
    }

    await this.host.fileManager.processFrontMatter(file, (frontmatter: Frontmatter) => {
      frontmatter.stage = normalizeStage(stage);
    });
    this.recordStageOverrides.set(record.path, normalizeStage(stage));
  }
}

function stageLabel(stage: string): string {
  // Show the label exactly as written in Pipeline.md (as the user created it).
  return stage;
}

function dropsBefore(card: HTMLElement, event: DragEvent): boolean {
  const rect = card.getBoundingClientRect();
  return event.clientY < rect.top + rect.height / 2;
}
