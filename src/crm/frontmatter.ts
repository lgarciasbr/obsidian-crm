export function frontmatter(data: Record<string, string | string[]>, body: string): string {
  const yaml = Object.entries(data)
    .map(([key, value]) => {
      if (Array.isArray(value) && !value.length) {
        return `${key}: []`;
      }
      if (Array.isArray(value)) {
        return `${key}:\n${value.map((item) => `  - ${quoteYaml(item)}`).join("\n")}`;
      }

      return value ? `${key}: ${quoteYaml(value)}` : `${key}:`;
    })
    .join("\n");

  return `---\n${yaml}\n---\n\n${body}`;
}

export function wikilink(value: string | undefined): string {
  const clean = value?.trim();
  return clean ? `[[${clean}]]` : "";
}

function quoteYaml(value: string): string {
  if (!value) {
    return "";
  }

  return JSON.stringify(value);
}
