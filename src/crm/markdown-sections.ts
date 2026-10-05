import type { TFile, Vault } from "obsidian";

// Pure helpers for `## Heading` sections in CRM note bodies. They always leave
// the canonical layout: heading, blank line, content, blank line, next heading.

export async function addLinkToSection(vault: Vault, file: TFile, heading: string, link: string): Promise<void> {
  await updateFile(vault, file, (content) => addListItemToSection(content, heading, link));
}

export async function addLineToSectionInFile(vault: Vault, file: TFile, heading: string, line: string): Promise<void> {
  await updateFile(vault, file, (content) => addLineToSection(content, heading, line));
}

export async function removeLinkFromSection(vault: Vault, file: TFile, heading: string, link: string): Promise<void> {
  await updateFile(vault, file, (content) => removeListItemFromSection(content, heading, link));
}

export async function setSectionBodyInFile(vault: Vault, file: TFile, heading: string, body: string): Promise<void> {
  await updateFile(vault, file, (content) => setSectionBody(content, heading, body));
}

export function addListItemToSection(content: string, heading: string, link: string): string {
  return addLineToSection(content, heading, `- ${link}`);
}

// Appends `item` (a full line such as "- [[x]]" or "- [ ] task") to the
// section, joining an existing list; a no-op if the line is already there.
export function addLineToSection(content: string, heading: string, item: string): string {
  return editSection(content, heading, (body) => {
    if (body.some((line) => line.trim() === item)) {
      return body;
    }
    const last = body[body.length - 1];
    if (last === undefined) {
      return [item];
    }
    return last.trim().startsWith("- ") ? [...body, item] : [...body, "", item];
  });
}

export function removeListItemFromSection(content: string, heading: string, link: string): string {
  const item = `- ${link}`;
  return editSection(content, heading, (body) => body.filter((line) => line.trim() !== item), false);
}

export function setSectionBody(content: string, heading: string, text: string): string {
  return editSection(content, heading, () => (text.trim() ? text.trim().split("\n") : []));
}

function editSection(
  content: string,
  heading: string,
  edit: (body: string[]) => string[],
  createIfMissing = true
): string {
  const headingLine = `## ${heading}`;
  const lines = content.replace(/\s+$/, "").split("\n");
  const start = lines.findIndex((line) => line.trim() === headingLine);

  if (start === -1) {
    const body = edit([]);
    if (!createIfMissing || !body.length) {
      return content;
    }
    return `${lines.join("\n")}\n\n${headingLine}\n\n${body.join("\n")}\n`;
  }

  let end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  if (end === -1) {
    end = lines.length;
  }

  const current = trimBlankLines(lines.slice(start + 1, end));
  const next = trimBlankLines(edit(current));
  if (next.length === current.length && next.every((line, index) => line === current[index])) {
    return content;
  }

  const section = next.length ? [headingLine, "", ...next] : [headingLine];
  const rest = lines.slice(end);
  const rebuilt = [...lines.slice(0, start), ...section, ...(rest.length ? ["", ...rest] : [])];
  return `${rebuilt.join("\n")}\n`;
}

function trimBlankLines(lines: string[]): string[] {
  let first = 0;
  let last = lines.length;
  while (first < last && !lines[first].trim()) first += 1;
  while (last > first && !lines[last - 1].trim()) last -= 1;
  return lines.slice(first, last);
}

async function updateFile(vault: Vault, file: TFile, change: (content: string) => string): Promise<void> {
  await vault.process(file, change);
}
