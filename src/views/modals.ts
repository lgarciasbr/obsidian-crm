import { App, ButtonComponent, Modal, Notice, Setting } from "obsidian";

export class PipelineStageModal extends Modal {
  private value = "";
  private submitting = false;
  private submitButton: ButtonComponent | null = null;

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
        text.setPlaceholder("For example: Qualified");
        text.setValue(this.initialValue);
        text.onChange((value) => {
          this.value = value;
        });
      });

    new Setting(contentEl)
      .addButton((button) => {
        this.submitButton = button;
        button
          .setButtonText(this.initialValue ? "Rename stage" : "Create stage")
          .setCta()
          .onClick(() => void this.submit());
      });

    this.scope.register([], "Enter", (event) => {
      event.preventDefault();
      void this.submit();
      return false;
    });
  }

  private async submit(): Promise<void> {
    if (this.submitting) {
      return;
    }
    if (!this.value.trim()) {
      new Notice("Stage name is required.");
      return;
    }

    this.submitting = true;
    this.submitButton?.setDisabled(true);
    try {
      await this.onSubmit(this.value);
      this.close();
    } catch (error) {
      console.error("CRM: could not save the stage", error);
      new Notice(`Could not save the stage: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.submitting = false;
      this.submitButton?.setDisabled(false);
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class ConfirmModal extends Modal {
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
            button.setDisabled(true);
            try {
              await this.onConfirm();
            } catch (error) {
              console.error("CRM: could not delete", error);
              new Notice(`Could not delete: ${error instanceof Error ? error.message : String(error)}`);
            }
            this.close();
          })
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
