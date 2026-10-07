[< Story](index.md)

# Test Guide — TS-002

## Automated / Local Validation

Run from repository root:

```bash
npm run build
```

Inspect source/config for forbidden behavior:

```bash
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(" main.ts manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
```

Expected result:

- build passes;
- scan returns no matches for intentional network, telemetry, IA SDK, backend client, Node filesystem, process-spawning behavior, or absolute-path coupling.

## E2E Decision

Manual Obsidian validation is required for TS-002.

Reason: this story changes vault folders, so the Navigator must confirm the actual folder structure appears in the test vault.

## Navigator Validation

Manual route:

1. Build and deploy plugin artifacts to the test vault.
2. Open/reload Obsidian test vault:

```text
<TestVault>
```

3. Run the folder initialization route.
4. Confirm the folder tree exists:

```text
CRM/
  People/
  Companies/
  Opportunities/
  Interactions/
```

Expected observation:

- the CRM folder tree exists under the configured root.

Pass condition:

- required CRM folders exist under the configured root;
- no unexpected files or external integrations are created.

Fail condition:

- folders are missing;
- folders are created outside the configured root;
- plugin errors during folder initialization.

## Validation Evidence

Implementation evidence captured on 2026-07-04:

- `npm run build` completed successfully.
- Source/config forbidden-behavior scan returned no matches.
- Updated plugin artifacts were copied to the test vault plugin folder.

Manual Obsidian validation remains pending Navigator confirmation:

- reload/enable Relationship CRM in the test vault;
- run command `Initialize CRM folders`;
- confirm `CRM/People`, `CRM/Companies`, `CRM/Opportunities`, and `CRM/Interactions` exist.
