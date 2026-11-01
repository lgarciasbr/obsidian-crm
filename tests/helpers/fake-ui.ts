// Minimal UI stand-ins: exercise modal choices without opening a real vault.
export class UiElement {
  children: UiElement[] = [];
  settings: Setting[] = [];
  text = "";
  addClass(_name: string): void {}
  empty(): void { this.children = []; this.settings = []; }
  createEl(_tag: string, options: { text?: string; cls?: string } = {}): UiElement {
    const child = new UiElement(); child.text = options.text || ""; this.children.push(child); return child;
  }
  createDiv(options: { text?: string; cls?: string } = {}): UiElement { return this.createEl("div", options); }
  allSettings(): Setting[] { return [...this.settings, ...this.children.flatMap((c) => c.allSettings())]; }
}

export class Control {
  value: string | boolean = "";
  options: Record<string, string> = {};
  inputEl = { type: "text" };
  change: (value: never) => void = () => undefined;
  setValue(value: string | boolean): this { this.value = value; return this; }
  setPlaceholder(_value: string): this { return this; }
  setButtonText(value: string): this { this.value = value; return this; }
  setCta(): this { return this; }
  setDisabled(_disabled: boolean): this { return this; }
  addOption(key: string, label: string): this { this.options[key] = label; return this; }
  onChange(fn: (value: never) => void): this { this.change = fn; return this; }
  onClick(fn: () => void): this { this.change = fn; return this; }
  select(value: string | boolean): void { this.value = value; this.change(value as never); }
}

export class Setting {
  name = "";
  desc = "";
  controls: Control[] = [];
  constructor(parent: UiElement) { parent.settings.push(this); }
  setName(name: string): this { this.name = name; return this; }
  setDesc(desc: string): this { this.desc = desc; return this; }
  private add(fn: (control: Control) => void): this { const c = new Control(); this.controls.push(c); fn(c); return this; }
  addText(fn: (c: Control) => void): this { return this.add(fn); }
  addDropdown(fn: (c: Control) => void): this { return this.add(fn); }
  addToggle(fn: (c: Control) => void): this { return this.add(fn); }
  addButton(fn: (c: Control) => void): this { return this.add(fn); }
}

export class Modal {
  contentEl = new UiElement();
  modalEl = new UiElement();
  scope = { register: (..._args: unknown[]) => undefined };
  constructor(_app: unknown) {}
  close(): void {}
}

export { Control as ButtonComponent };
