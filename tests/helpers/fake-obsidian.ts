// Minimal in-memory stand-in for the "obsidian" module so CRM flows can run in
// Node. The metadata cache only knows files that were explicitly indexed,
// which reproduces Obsidian's lag in indexing notes created a moment ago.
import Module from "module";

export class TAbstractFile {
  constructor(public path: string) {}
}

export class TFolder extends TAbstractFile {
  constructor(path: string, private vault?: FakeVault) {
    super(path);
  }
  // Direct children, derived from the files and folders the fake vault knows.
  get children(): TAbstractFile[] {
    if (!this.vault) return [];
    const prefix = `${this.path}/`;
    const childFolders = new Set<string>();
    const files: TAbstractFile[] = [];
    for (const { file } of this.vault.files.values()) {
      if (!file.path.startsWith(prefix)) continue;
      const rest = file.path.slice(prefix.length);
      if (rest.includes("/")) childFolders.add(prefix + rest.split("/")[0]);
      else files.push(file);
    }
    for (const folder of this.vault.folders) {
      const rest = folder.startsWith(prefix) ? folder.slice(prefix.length) : "";
      if (rest && !rest.includes("/")) childFolders.add(folder);
    }
    return [...[...childFolders].map((path) => new TFolder(path, this.vault)), ...files];
  }
}

export class TFile extends TAbstractFile {
  get extension(): string {
    return this.path.split(".").pop() ?? "";
  }
  get basename(): string {
    return this.path.split("/").pop()!.replace(/\.md$/, "");
  }
  get parent(): { path: string } {
    return { path: this.path.split("/").slice(0, -1).join("/") };
  }
}

export class Notice {
  constructor(_message: string) {}
}

type Frontmatter = Record<string, unknown>;

export function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  const result: Frontmatter = {};
  if (!match) return result;
  let listKey: string | null = null;
  for (const line of match[1].split("\n")) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      (result[listKey] as unknown[]).push(scalar(item[1]) as string);
      continue;
    }
    const pair = line.match(/^([\w-]+):\s*(.*)$/);
    if (!pair) continue;
    listKey = null;
    if (pair[2] === "") {
      result[pair[1]] = [];
      listKey = pair[1];
    } else {
      result[pair[1]] = scalar(pair[2]);
    }
  }
  // An empty key with no list items is an empty value, not an empty list.
  for (const [key, value] of Object.entries(result)) {
    if (Array.isArray(value) && !value.length) result[key] = "";
  }
  return result;
}

function scalar(raw: string): string | string[] {
  if (raw === "[]") return [];
  return raw.startsWith('"') ? JSON.parse(raw) : raw;
}

function serialize(fm: Frontmatter): string {
  return Object.entries(fm)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length ? `${key}:\n${value.map((v) => `  - ${JSON.stringify(v)}`).join("\n")}` : `${key}: []`;
      }
      const text = value === null || value === undefined ? "" : String(value);
      return text ? `${key}: ${JSON.stringify(text)}` : `${key}:`;
    })
    .join("\n");
}

export class FakeVault {
  files = new Map<string, { file: TFile; content: string }>();
  folders = new Set<string>();
  trashed: string[] = [];

  async create(path: string, content: string): Promise<TFile> {
    if (this.files.has(path)) throw new Error(`File already exists: ${path}`);
    const file = new TFile(path);
    this.files.set(path, { file, content });
    return file;
  }
  async read(file: TFile): Promise<string> {
    return this.files.get(file.path)!.content;
  }
  async modify(file: TFile, content: string): Promise<void> {
    this.files.get(file.path)!.content = content;
  }
  async process(file: TFile, fn: (content: string) => string): Promise<string> {
    const entry = this.files.get(file.path)!;
    entry.content = fn(entry.content);
    return entry.content;
  }
  async createFolder(path: string): Promise<void> {
    this.folders.add(path);
  }
  getAbstractFileByPath(path: string): TAbstractFile | null {
    if (this.files.has(path)) return this.files.get(path)!.file;
    const isFolder = this.folders.has(path) || [...this.files.keys()].some((file) => file.startsWith(`${path}/`));
    return isFolder ? new TFolder(path, this) : null;
  }
  getMarkdownFiles(): TFile[] {
    return [...this.files.values()].map((entry) => entry.file);
  }
  content(path: string): string {
    const entry = this.files.get(path);
    if (!entry) throw new Error(`No file at ${path}. Files: ${[...this.files.keys()].join(", ")}`);
    return entry.content;
  }
}

export class FakeMetadataCache {
  indexed = new Set<TFile>();
  constructor(private vault: FakeVault) {}

  indexAll(): void {
    for (const file of this.vault.getMarkdownFiles()) this.indexed.add(file);
  }
  getFileCache(file: TFile): { frontmatter: Frontmatter } | null {
    return this.indexed.has(file) ? { frontmatter: parseFrontmatter(this.vault.content(file.path)) } : null;
  }
  getFirstLinkpathDest(linkpath: string, _source: string): TFile | null {
    return this.vault.getMarkdownFiles().find((file) => file.basename === linkpath) ?? null;
  }
}

export class FakeFileManager {
  constructor(private vault: FakeVault) {}

  async processFrontMatter(file: TFile, fn: (fm: Frontmatter) => void): Promise<void> {
    const content = this.vault.content(file.path);
    const fm = parseFrontmatter(content);
    fn(fm);
    const body = content.replace(/^---\n[\s\S]*?\n---\n?/, "");
    await this.vault.modify(file, `---\n${serialize(fm)}\n---\n${body}`);
  }

  async trashFile(file: TFile): Promise<void> {
    this.vault.files.delete(file.path);
    this.vault.trashed.push(file.path);
  }

  // Mirrors Obsidian with "Automatically update internal links" enabled.
  async renameFile(file: TFile, newPath: string): Promise<void> {
    const oldBase = file.basename;
    const entry = this.vault.files.get(file.path)!;
    this.vault.files.delete(file.path);
    file.path = newPath;
    this.vault.files.set(newPath, entry);
    const newBase = file.basename;
    for (const other of this.vault.files.values()) {
      other.content = other.content.split(`[[${oldBase}]]`).join(`[[${newBase}]]`);
    }
  }
}

// Mirrors Obsidian's normalizePath: forward slashes, no duplicate or edge slashes.
export function normalizePath(path: string): string {
  const clean = path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/|\/$/g, "").normalize("NFC");
  return clean || "/";
}

export const fakeWorkspace = { getLeaf: () => ({ openFile: async () => undefined }) };

const fakeModule = new Proxy({ TAbstractFile, TFolder, TFile, Notice, normalizePath } as Record<string, unknown>, {
  get(target, key: string) {
    if (key in target) return target[key];
    if (key === "debounce") return (fn: unknown) => fn;
    return class {};
  },
});

const moduleWithLoad = Module as unknown as { _load: (request: string, ...rest: unknown[]) => unknown };
const originalLoad = moduleWithLoad._load;
moduleWithLoad._load = function (request: string, ...rest: unknown[]) {
  return request === "obsidian" ? fakeModule : originalLoad.call(this, request, ...rest);
};
