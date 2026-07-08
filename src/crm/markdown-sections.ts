import { TFile, Vault } from "obsidian";

export async function addLinkToSection(vault: Vault, file: TFile, heading: string, link: string): Promise<void> {
  const content = await vault.read(file);
  const updated = addListItemToSection(content, heading, link);
  if (updated !== content) {
    await vault.modify(file, updated);
  }
}

export function addListItemToSection(content: string, heading: string, link: string): string {
  const item = `- ${link}`;
  if (content.includes(item)) {
    return content;
  }

  const headingLine = `## ${heading}`;
  const lines = content.split("\n");
  const headingIndex = lines.findIndex((line) => line.trim() === headingLine);

  if (headingIndex === -1) {
    return `${content.trimEnd()}\n\n${headingLine}\n\n${item}\n`;
  }

  let insertIndex = lines.length;
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      insertIndex = index;
      break;
    }
  }

  const beforeInsert = lines[insertIndex - 1] ?? "";
  const insertion = beforeInsert.trim() ? ["", item] : [item];
  lines.splice(insertIndex, 0, ...insertion);
  return lines.join("\n");
}
