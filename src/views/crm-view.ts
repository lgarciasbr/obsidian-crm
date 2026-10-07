import { FileManager, TFile, TextFileView, Vault, WorkspaceLeaf, debounce } from "obsidian";
import { CrmSettings, normalizeFolderPath } from "../settings";
import { ensureCrmFolders } from "../crm/folders";
import { CrmRecord, CrmRepository } from "../crm/repository";
import { BoardHost, PipelineBoard } from "./pipeline-board";
import { ContactList, ListHost } from "./contact-list";

export const CRM_VIEW_TYPE = "crm-view";

export async function ensurePipelineFile(vault: Vault, settings: CrmSettings): Promise<TFile | null> {
  await ensureCrmFolders(vault, settings);

  const root = normalizeFolderPath(settings.crmRoot);
  const path = `${root}/Pipeline.md`;
  const file = vault.getAbstractFileByPath(path);
  return file instanceof TFile ? file : null;
}

type CrmTab = "pipeline" | "companies" | "contacts";

// What the view asks the plugin to do; the plugin owns modals and writes.
export interface CrmViewActions {
  addOpportunity(stage: string, onCreated?: () => void): void;
  logInteraction(record: CrmRecord, onCreated?: () => void): void;
  editOpportunity(record: CrmRecord, onEdited?: () => void): void;
  deleteOpportunity(record: CrmRecord): Promise<void>;
  addPerson(): Promise<void> | void;
  addCompany(): Promise<void> | void;
}

// The CRM view, backed by Pipeline.md: tabs for the pipeline board and for
// the company and contact lists.
export class CrmView extends TextFileView implements BoardHost, ListHost {
  data = "";
  private activeTab: CrmTab = "pipeline";
  private readonly board: PipelineBoard;
  private readonly list: ContactList;

  constructor(
    leaf: WorkspaceLeaf,
    readonly repository: CrmRepository,
    readonly fileManager: FileManager,
    readonly settings: CrmSettings,
    readonly actions: CrmViewActions
  ) {
    super(leaf);
    this.board = new PipelineBoard(this);
    this.list = new ContactList(this);
  }

  // Redraw safely, only after the metadataCache settles.
  readonly scheduleRender = debounce(() => this.render(), 120, true);

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
    return this.data;
  }

  setViewData(data: string, clear: boolean): void {
    this.data = data;
    if (clear) {
      this.clear();
    }
    this.render();
  }

  clear(): void {
    this.contentEl.empty();
  }

  render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("crm-view");

    const navigation = contentEl.createDiv({ cls: "crm-navigation" });
    const tabs = navigation.createDiv({ cls: "crm-tabs" });
    this.renderTabButton(tabs, "Pipeline", "pipeline");
    this.renderTabButton(tabs, "Companies", "companies");
    this.renderTabButton(tabs, "Contacts", "contacts");

    if (this.activeTab === "pipeline") {
      this.board.render(contentEl);
    } else {
      this.list.render(contentEl, this.activeTab === "contacts" ? "person" : "company");
    }
  }

  async openRelatedRecord(type: "crm/company" | "crm/person", name: string): Promise<void> {
    const record = this.repository.findByName(type, name);
    if (record) {
      await this.openRecord(record);
    }
  }

  async openRecord(record: CrmRecord): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(record.path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf("tab").openFile(file);
    }
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
      this.list.resetSearch();
      this.render();
    });
  }
}
