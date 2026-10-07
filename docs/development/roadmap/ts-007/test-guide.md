[< Story](index.md)

# Test Guide — TS-007

## Automated / Local Validation

```bash
npm run build
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(" main.ts src manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
```

## Navigator Validation

1. Reload/enable Relationship CRM in the test vault.
2. Ensure one person, company, and opportunity exist.
3. Run `Log interaction`.
4. Select existing person, company, and opportunity.
5. Fill summary, outcome, next action, and next action date.
6. Confirm a note exists under `CRM/Interactions`.
7. Confirm frontmatter includes `type: "crm/interaction"` and linked selected records.
8. Confirm no related entity frontmatter was updated yet.
9. Confirm no follow-up task was generated yet.

## Validation Evidence

Implementation evidence captured on 2026-07-04:

- `npm run build` completed successfully.
- Source/config forbidden-behavior scan returned no matches.
- Updated plugin artifacts were copied to the test vault plugin folder.

Manual Obsidian validation remains pending Navigator confirmation.
