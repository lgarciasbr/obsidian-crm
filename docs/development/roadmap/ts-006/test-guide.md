[< Story](index.md)

# Test Guide — TS-006

## Automated / Local Validation

Run from repository root:

```bash
npm run build
```

Inspect source/config for forbidden behavior:

```bash
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(" main.ts src manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
```

## E2E Decision

Manual Obsidian validation is required for TS-006.

## Navigator Validation

Manual route:

1. Reload/enable Relationship CRM in the test vault.
2. Create/reuse an existing company.
3. Create a person selecting the existing company from the dropdown.
4. Confirm the person links to the company.
5. Create a person with a missing company and turn on `Create company if missing`.
6. Confirm the company note is created and the person links to it.
7. Create/reuse an existing person and company.
8. Create an opportunity selecting existing company/contact.
9. Confirm the opportunity links to existing records.
10. Create an opportunity with missing company/contact and turn on the create toggles.
11. Confirm missing related records are created and linked.
12. Confirm typed missing names without create toggles remain plain text.

## Validation Evidence

Implementation evidence captured on 2026-07-04:

- `npm run build` completed successfully.
- Source/config forbidden-behavior scan returned no matches.
- Updated plugin artifacts were copied to the test vault plugin folder.

Manual Obsidian validation remains pending Navigator confirmation.
