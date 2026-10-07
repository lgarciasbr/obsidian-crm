// "[[Acme]]" or "[[Acme|label]]" -> "Acme"; plain text is returned trimmed.
export function cleanLink(value: string): string {
  return value.replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0].trim();
}
