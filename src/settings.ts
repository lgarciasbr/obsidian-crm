import { App, normalizePath, PluginSettingTab, Setting } from "obsidian";
import CrmPlugin from "../main";

export interface CrmSettings {
  crmRoot: string;
  createTasksByDefault: boolean;
  taskTag: string;
  defaultCurrency: string;
  locale: string;
}

export const DEFAULT_SETTINGS: CrmSettings = {
  crmRoot: "CRM",
  createTasksByDefault: true,
  taskTag: "#crm/follow-up",
  defaultCurrency: "BRL",
  locale: "pt-BR",
};

// Resolves the effective locale: the configured one, or the system locale.
export function resolveLocale(settings: CrmSettings): string {
  const configured = (settings.locale || "").trim();
  if (configured) {
    return configured;
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || "en";
  } catch (_error) {
    return "en";
  }
}

// The CRM folder, relative to the vault root. Paths that are empty or that
// try to leave the vault ("..") fall back to the default folder.
export function normalizeFolderPath(path: string): string {
  const clean = normalizePath(path.trim().replace(/\\/g, "/")).replace(/^\/+|\/+$/g, "");
  const segments = clean.split("/");
  if (!clean || segments.some((segment) => segment === ".." || segment === ".")) {
    return DEFAULT_SETTINGS.crmRoot;
  }
  return clean;
}

export class CrmSettingTab extends PluginSettingTab {
  plugin: CrmPlugin;

  constructor(app: App, plugin: CrmPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Root folder")
      .setDesc("Folder where CRM records are stored.")
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.crmRoot)
          .setValue(this.plugin.settings.crmRoot)
          .onChange(async (value) => {
            this.plugin.settings.crmRoot = normalizeFolderPath(value || DEFAULT_SETTINGS.crmRoot);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Create follow-up tasks")
      .setDesc("Add a Markdown task when an interaction or Set next action has a next action.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.createTasksByDefault)
          .onChange(async (value) => {
            this.plugin.settings.createTasksByDefault = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Follow-up task tag")
      .setDesc("Tag added to follow-up tasks. Leave empty for no tag.")
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.taskTag)
          .setValue(this.plugin.settings.taskTag)
          .onChange(async (value) => {
            this.plugin.settings.taskTag = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default currency")
      .setDesc("ISO currency code used to display opportunity values (e.g. BRL, USD, EUR).")
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.defaultCurrency)
          .setValue(this.plugin.settings.defaultCurrency)
          .onChange(async (value) => {
            this.plugin.settings.defaultCurrency = (value || DEFAULT_SETTINGS.defaultCurrency).trim().toUpperCase();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Locale")
      .setDesc("Locale for displaying dates and numbers (e.g. pt-BR, en-US). Leave empty to use the system locale. Storage stays ISO.")
      .addText((text) =>
        text
          .setPlaceholder("auto")
          .setValue(this.plugin.settings.locale)
          .onChange(async (value) => {
            this.plugin.settings.locale = (value || "").trim();
            await this.plugin.saveSettings();
          })
      );
  }
}
