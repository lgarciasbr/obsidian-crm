import { TFile, Vault } from "obsidian";
import { CRM_SUBFOLDERS } from "../constants";
import { normalizeFolderPath } from "../settings";

export async function ensureCrmFolders(vault: Vault, crmRoot: string): Promise<void> {
  const root = normalizeFolderPath(crmRoot);
  await ensureFolder(vault, root);

  for (const subfolder of CRM_SUBFOLDERS) {
    await ensureFolder(vault, `${root}/${subfolder}`);
  }

  await ensurePipelineFile(vault, root);
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

  const content = "---\ntype: crm/pipeline\nstages:\n  - lead\n  - conversation\n  - proposal\n  - negotiation\n  - won\n  - lost\n  - paused\n---\n\n# Pipeline\n\nThis file anchors the CRM pipeline board.\n";
  const created = await vault.create(path, content);
  return created instanceof TFile ? created : null;
}
