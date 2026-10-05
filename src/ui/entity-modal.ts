import { App, Modal, Notice, Setting } from "obsidian";
import { EntityField, EntityFormResult } from "../crm/types";

export class EntityModal extends Modal {
  private values: EntityFormResult = {};

  constructor(
    app: App,
    private title: string,
    private fields: EntityField[],
    private onSubmit: (values: EntityFormResult) => Promise<void>,
    private submitLabel = "Create"
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

    new Setting(contentEl)
      .addButton((button) =>
        button
          .setButtonText(this.submitLabel)
          .setCta()
          .onClick(async () => {
            const missing = this.fields.find((field) => field.required && !this.valueFor(field).trim());
            if (missing) {
              new Notice(`${missing.label} is required.`);
              return;
            }

            await this.onSubmit(this.values);
            this.close();
          })
      );
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
        });
      });
  }

  private valueFor(field: EntityField): string {
    return this.values[field.key] || this.values[`${field.key}_new`] || "";
  }
}

function existingRecordDescription(field: EntityField): string {
  return field.options?.length ? "Select an existing record." : "No existing records yet.";
}
