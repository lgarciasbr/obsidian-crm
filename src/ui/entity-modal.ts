import { App, ButtonComponent, Modal, Notice, Setting } from "obsidian";
import { EntityField, EntityFormResult, PendingFollowUp } from "../crm/types";

export class EntityModal extends Modal {
  private values: EntityFormResult = {};
  private submitting = false;
  private submitButton: ButtonComponent | null = null;
  private followUpEl: HTMLElement | null = null;
  private completionSelection = new Set<string>();

  constructor(
    app: App,
    private title: string,
    private fields: EntityField[],
    private onSubmit: (values: EntityFormResult) => Promise<void>,
    private submitLabel = "Create",
    private pendingFollowUps?: (values: EntityFormResult) => PendingFollowUp[]
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    this.modalEl.addClass("crm-modal-container");
    contentEl.empty();
    contentEl.addClass("crm-modal");
    contentEl.createEl("h2", { text: this.title });

    let currentSection = "";
    for (const field of this.fields) {
      if (this.pendingFollowUps && ["next_action", "next_action_date"].includes(field.key)) {
        continue;
      }
      if (field.section && field.section !== currentSection) {
        currentSection = field.section;
        contentEl.createEl("h3", { text: currentSection, cls: "crm-modal-section" });
      }

      if (field.defaultValue) {
        this.values[field.key] = field.defaultValue;
      }

      if (field.options) {
        this.addOptionField(contentEl, field);
      } else {
        this.addTextField(contentEl, field);
      }
    }

    if (this.pendingFollowUps) {
      this.followUpEl = contentEl.createDiv({ cls: "crm-follow-up" });
      this.renderFollowUp();
    }

    new Setting(contentEl)
      .addButton((button) => {
        this.submitButton = button;
        button
          .setButtonText(this.submitLabel)
          .setCta()
          .onClick(() => this.submit());
      });

    this.scope.register([], "Enter", (event) => {
      if (event.target instanceof HTMLTextAreaElement) {
        return true;
      }
      event.preventDefault();
      void this.submit();
      return false;
    });
  }

  // Validates, saves once (a second click while saving is ignored) and keeps
  // the modal open with a notice if saving fails, so nothing is lost silently.
  private async submit(): Promise<void> {
    if (this.submitting) {
      return;
    }
    const missing = this.fields.find((field) => field.required && !this.valueFor(field).trim());
    if (missing) {
      new Notice(`${missing.label} is required.`);
      return;
    }

    if (this.pendingFollowUps) {
      const mode = this.values.next_action_mode || "keep";
      if (mode === "replace" && !this.values.next_action?.trim()) {
        new Notice("Enter the next action, or choose to keep or complete the current one.");
        return;
      }
      if (mode === "complete") {
        const selected = this.pendingFollowUps(this.values).filter((p) => this.completionSelection.has(p.path));
        if (!selected.length) {
          new Notice("Select the follow-up(s) to complete.");
          return;
        }
        this.values.complete_follow_ups = JSON.stringify(selected);
      }
    }

    this.submitting = true;
    this.submitButton?.setDisabled(true);
    try {
      await this.onSubmit(this.values);
      this.close();
    } catch (error) {
      console.error("CRM: could not save", error);
      new Notice(`Could not save: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.submitting = false;
      this.submitButton?.setDisabled(false);
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private addTextField(contentEl: HTMLElement, field: EntityField): void {
    new Setting(contentEl)
      .setName(field.label)
      .addText((text) => {
        if (field.inputType === "date") {
          // Native date picker: displays in the user's locale, value stays ISO.
          text.inputEl.type = "date";
        }
        text.setPlaceholder(field.placeholder || "");
        text.setValue(field.defaultValue || "");
        text.onChange((value) => {
          this.values[field.key] = value;
        });
      });
  }

  private addOptionField(contentEl: HTMLElement, field: EntityField): void {
    const hasOptions = Boolean(field.options?.length);

    if (hasOptions || !field.allowCreateNew) {
      new Setting(contentEl)
        .setName(field.label)
        .setDesc(field.allowCreateNew ? existingRecordDescription(field) : (field.noPlaceholderOption ? "" : "Select an option."))
        .addDropdown((dropdown) => {
          if (!field.noPlaceholderOption) {
            dropdown.addOption("", field.placeholder || "Select...");
          }
          for (const option of field.options || []) {
            dropdown.addOption(option, option);
          }
          if (field.defaultValue) {
            dropdown.setValue(field.defaultValue);
          }
          dropdown.onChange((value) => {
            this.values[field.key] = value;
            if (value) {
              this.values[`${field.key}_new`] = "";
            }
            this.relatedChanged(field.key);
          });
        });
    }

    if (!field.allowCreateNew) {
      return;
    }

    new Setting(contentEl)
      .setName(`Create ${field.label.toLowerCase()}`)
      .setDesc(hasOptions ? "Use when the record is not in the list above yet." : "No existing records yet.")
      .addText((text) => {
        text.setPlaceholder(field.placeholder || "");
        text.onChange((value) => {
          this.values[`${field.key}_new`] = value;
          if (value.trim()) {
            this.values[field.key] = "";
          }
          this.relatedChanged(field.key);
        });
      });
  }

  private relatedChanged(key: string): void {
    if (!this.pendingFollowUps || !["person", "company", "opportunity"].includes(key)) return;
    // Switching records must never carry completion consent to another follow-up.
    this.completionSelection.clear();
    this.values.next_action_mode = "keep";
    this.renderFollowUp();
  }

  private renderFollowUp(): void {
    const el = this.followUpEl;
    if (!el || !this.pendingFollowUps) return;
    el.empty();
    el.createEl("h3", { text: "Next step", cls: "crm-modal-section" });
    const pending = this.pendingFollowUps(this.values);
    const mode = this.values.next_action_mode || "keep";
    for (const p of pending) {
      const item = el.createDiv({ cls: "crm-follow-up-current" });
      item.createEl("strong", { text: p.label });
      item.createDiv({ text: p.action + (p.date ? ` · ${p.date}` : "") });
    }
    if (!pending.length) {
      new Setting(el).setName("Define a next action").addToggle((toggle) => {
        toggle.setValue(mode === "replace").onChange((value) => {
          this.values.next_action_mode = value ? "replace" : "keep";
          this.renderFollowUp();
        });
      });
    } else {
      new Setting(el).setName("After this interaction").addDropdown((dropdown) => {
        dropdown.addOption("keep", "Keep current follow-up(s)")
          .addOption("replace", "Replace with another action")
          .addOption("complete", "Complete — no next action")
          .setValue(mode).onChange((value) => {
            this.values.next_action_mode = value;
            this.completionSelection.clear();
            this.renderFollowUp();
          });
      });
    }
    if (mode === "replace") {
      for (const field of this.fields.filter((f) => ["next_action", "next_action_date"].includes(f.key))) {
        this.addTextField(el, { ...field, defaultValue: this.values[field.key] });
      }
      el.createEl("p", { text: "The new action will apply to the selected person, company and opportunity.", cls: "setting-item-description" });
    } else if (mode === "complete") {
      el.createEl("p", { text: "Choose exactly which follow-ups to complete. Their action and date will be cleared when you save; other records stay unchanged." });
      for (const p of pending) {
        new Setting(el).setName(p.label).setDesc(p.action + (p.date ? ` · ${p.date}` : ""))
          .addToggle((toggle) => toggle.setValue(this.completionSelection.has(p.path)).onChange((value) => {
            if (value) this.completionSelection.add(p.path);
            else this.completionSelection.delete(p.path);
          }));
      }
    }
  }

  private valueFor(field: EntityField): string {
    return this.values[field.key] || this.values[`${field.key}_new`] || "";
  }
}

function existingRecordDescription(field: EntityField): string {
  return field.options?.length ? "Select an existing record." : "No existing records yet.";
}
