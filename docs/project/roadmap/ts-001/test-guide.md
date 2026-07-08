[< Story](index.md)

# Test Guide — TS-001

## Automated / Local Validation

Run from repository root:

```bash
npm install
npm run build
```

Then verify:

```bash
test -f main.js
test -f manifest.json
test -f styles.css
```

Inspect for forbidden scaffold behavior:

```bash
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(" .
```

Expected result:

- no build errors;
- required plugin artifacts exist;
- no intentional network, telemetry, IA SDK, backend client, Node filesystem, or process-spawning behavior is present.

## E2E Decision

E2E is manual for TS-001.

Reason: this story only proves the plugin scaffold can load in Obsidian. Full behavioral E2E starts after CRM commands/views exist.

## Navigator Validation

Manual route:

1. Copy `main.js`, `manifest.json`, and `styles.css` into a test vault:

```text
<TestVault>/.obsidian/plugins/relationship-crm/
```

2. Open Obsidian.
3. Enable the plugin.

Expected observation:

- Relationship CRM appears as an installed plugin.
- Plugin enables without runtime error.
- No CRM behavior is expected yet beyond successful load/unload.

Pass condition:

- plugin enables successfully and no runtime error appears.

Fail condition:

- build artifacts are missing;
- plugin cannot be enabled;
- Obsidian reports a runtime error on load.

## Validation Evidence

Implementation evidence captured on 2026-07-04:

- `npm install` completed successfully.
- `npm run build` completed successfully.
- `main.js`, `manifest.json`, and `styles.css` exist.
- `npm audit --audit-level=moderate` reports `found 0 vulnerabilities` after updating esbuild.
- Source/config forbidden-behavior scan returned no matches for intentional network, telemetry, IA SDK, backend client, Node filesystem, or process-spawning behavior.

Manual Obsidian enablement remains pending Navigator validation.
