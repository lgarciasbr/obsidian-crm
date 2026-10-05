import { TFile, Vault } from "obsidian";
import { CRM_SUBFOLDERS } from "../constants";
import { DEFAULT_STAGES } from "./integrity";
import { CrmSettings, normalizeFolderPath } from "../settings";
import { ensureAgentGuide } from "./agent-guide";

// Creates whatever is missing in the CRM root: folders, Pipeline.md and the
// agent guide. Never overwrites existing files.
export async function ensureCrmFolders(vault: Vault, settings: CrmSettings): Promise<void> {
  const root = normalizeFolderPath(settings.crmRoot);
  await ensureFolder(vault, root);

  for (const subfolder of CRM_SUBFOLDERS) {
    await ensureFolder(vault, `${root}/${subfolder}`);
  }

  await ensurePipelineFile(vault, root);
  await ensureAgentGuide(vault, settings);
}

async function ensureFolder(vault: Vault, path: string): Promise<void> {
  if (vault.getAbstractFileByPath(path)) {
    return;
  }

  await vault.createFolder(path);
}

async function ensurePipelineFile(vault: Vault, root: string): Promise<TFile | null> {
  const path = `${root}/Pipeline.md`;
  const existing = vault.getAbstractFileByPath(path);
  if (existing instanceof TFile) {
    return existing;
  }

  const stages = DEFAULT_STAGES.map((stage) => `  - ${stage}`).join("\n");
  const content = `---\ntype: crm/pipeline\nstages:\n${stages}\n---\n\n# Pipeline\n\nThis file anchors the CRM pipeline board.\n`;
  const created = await vault.create(path, content);
  return created instanceof TFile ? created : null;
}
