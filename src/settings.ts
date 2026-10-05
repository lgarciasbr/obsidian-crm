import { App, PluginSettingTab, Setting } from "obsidian";
import RelationshipCrmPlugin from "../main";

export interface RelationshipCrmSettings {
  crmRoot: string;
  defaultFollowupDays: number;
  coolingThresholdDays: number;
  createTasksByDefault: boolean;
  taskTag: string;
  defaultCurrency: string;
  locale: string;
}

export const DEFAULT_SETTINGS: RelationshipCrmSettings = {
  crmRoot: "CRM",
  defaultFollowupDays: 7,
  coolingThresholdDays: 60,
  createTasksByDefault: true,
  taskTag: "#crm/follow-up",
  defaultCurrency: "BRL",
  locale: "pt-BR",
};

// Resolves the effective locale: the configured one, or the system locale.
export function resolveLocale(settings: RelationshipCrmSettings): string {
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

export function normalizeFolderPath(path: string): string {
  return path
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "") || DEFAULT_SETTINGS.crmRoot;
}

export class RelationshipCrmSettingTab extends PluginSettingTab {
  plugin: RelationshipCrmPlugin;

  constructor(app: App, plugin: RelationshipCrmPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "CRM" });

    new Setting(containerEl)
      .setName("CRM root folder")
      .setDesc("Folder where CRM records will be stored.")
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
