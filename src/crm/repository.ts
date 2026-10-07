import { MetadataCache, TFile, TFolder, Vault } from "obsidian";
import type { Frontmatter } from "./values";
import { CrmSettings, normalizeFolderPath } from "../settings";

export type CrmRecordType = "crm/person" | "crm/company" | "crm/opportunity" | "crm/interaction";

export interface CrmRecord {
  type: CrmRecordType;
  name: string;
  path: string;
  basename: string;
  frontmatter: Record<string, unknown>;
}

const CRM_RECORD_TYPES = new Set<string>([
  "crm/person",
  "crm/company",
  "crm/opportunity",
  "crm/interaction",
]);

export class CrmRepository {
  constructor(
    private vault: Vault,
    private metadataCache: MetadataCache,
    private settings: CrmSettings
  ) {}

  listRecords(type?: CrmRecordType): CrmRecord[] {
    // Walk only the CRM folder: vaults can hold tens of thousands of files.
    const root = this.vault.getAbstractFileByPath(normalizeFolderPath(this.settings.crmRoot));
    const files: TFile[] = [];
    if (root instanceof TFolder) {
      collectMarkdownFiles(root, files);
    }

    return files
      .map((file) => this.recordFromFile(file))
      .filter((record): record is CrmRecord => record !== null)
      .filter((record) => !type || record.type === type);
  }

  names(type: CrmRecordType): string[] {
    return this.listRecords(type).map((record) => record.name).sort((a, b) => a.localeCompare(b));
  }

  findByName(type: CrmRecordType, name: string | undefined): CrmRecord | null {
    const normalizedName = normalizeName(name);
    if (!normalizedName) {
      return null;
    }

    // Contract §3: resolve only when the name matches exactly one record.
    // Basename takes precedence (unique key, e.g. "Company - Name"); ties are
    // ambiguous and must NOT be silently resolved to "the first match".
    const records = this.listRecords(type);
    const byBasename = records.filter((record) => normalizeName(record.basename) === normalizedName);
    const pool = byBasename.length ? byBasename : records.filter((record) => normalizeName(record.name) === normalizedName);
    if (pool.length === 1) {
      return pool[0];
    }
    return null;
  }

  resolveLinkOrText(type: CrmRecordType, name: string | undefined): string {
    const clean = name?.trim() || "";
    if (!clean) {
      return "";
    }

    const record = this.findByName(type, clean);
    return record ? `[[${record.basename}]]` : clean;
  }

  private recordFromFile(file: TFile): CrmRecord | null {
    const frontmatter: Frontmatter | undefined = this.metadataCache.getFileCache(file)?.frontmatter;
    const type = frontmatter?.type;

    if (typeof type !== "string" || !CRM_RECORD_TYPES.has(type)) {
      return null;
    }

    return {
      type: type as CrmRecordType,
      name: typeof frontmatter?.name === "string" ? frontmatter.name : file.basename,
      path: file.path,
      basename: file.basename,
      frontmatter: frontmatter as Record<string, unknown>,
    };
  }
}

function normalizeName(name: string | undefined): string {
  return (name || "").trim().toLowerCase();
}

function collectMarkdownFiles(folder: TFolder, out: TFile[]): void {
  for (const child of folder.children) {
    if (child instanceof TFolder) {
      collectMarkdownFiles(child, out);
    } else if (child instanceof TFile && child.extension === "md") {
      out.push(child);
    }
  }
}
