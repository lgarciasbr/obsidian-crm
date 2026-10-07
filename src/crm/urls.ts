// Values in CRM notes may come from imports, the web or AI agents, so a
// company's site is opened only when it is a plain web link. Anything else
// (javascript:, file:, OS protocol handlers such as search-ms:) is refused.
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export function safeExternalUrl(value: string): string | null {
  const clean = value.trim();
  if (!clean) {
    return null;
  }
  try {
    const url = new URL(SCHEME.test(clean) ? clean : `https://${clean}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch (_error) {
    return null;
  }
}
