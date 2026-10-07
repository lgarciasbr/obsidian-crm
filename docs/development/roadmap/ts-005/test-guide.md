[< Story](index.md)

# Test Guide — TS-005

## Automated / Local Validation

Run from repository root:

```bash
npm run build
```

Inspect source/config for forbidden behavior:

```bash
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(" main.ts src manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
```

Expected result:

- build passes;
- scan returns no matches for intentional network, telemetry, IA SDK, backend client, Node filesystem, process-spawning behavior, or absolute-path coupling.

## E2E Decision

Manual Obsidian validation is required for TS-005.

Reason: this story changes how relationship fields are stored in created Markdown files.

## Navigator Validation

Manual route:

1. Build and deploy plugin artifacts to the test vault.
2. Open/reload Obsidian test vault:

```text
<TestVault>
```

3. Ensure or create a company named `Acme`.
4. Create a person with company `Acme`.
5. Confirm person frontmatter uses:

```yaml
company: "[[Acme]]"
```

6. Create another person with company `Unknown Co`.
7. Confirm person frontmatter uses plain text, not a wikilink:

```yaml
company: "Unknown Co"
```

8. Ensure or create a person named `Maria Souza`.
9. Create an opportunity with company `Acme` and contact `Maria Souza`.
10. Confirm existing references are wikilinks.
11. Create an opportunity with a missing company/contact.
12. Confirm missing references are plain text, not unresolved wikilinks.

Expected observation:

- existing CRM records are resolved as wikilinks;
- missing related names are stored as plain text;
- clicking missing related names does not create root-level notes.

Pass condition:

- repository resolves existing CRM entities;
- missing related entities do not become unresolved wikilinks;
- entity creation still works;
- no root-level notes are created by missing relationship values.

Fail condition:

- existing CRM entities are not resolved;
- missing related names are stored as unresolved wikilinks;
- root-level notes are created by clicking missing related names;
- plugin errors during creation.

## Validation Evidence

Implementation evidence captured on 2026-07-04:

- `npm run build` completed successfully.
- Source/config forbidden-behavior scan returned no matches.
- Updated plugin artifacts were copied to the test vault plugin folder.

Manual Obsidian validation remains pending Navigator confirmation.
