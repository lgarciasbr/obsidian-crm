[< Story](index.md)

# Test Guide — TS-016

## Automated / Local Validation

```bash
npm run build
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(|/home/|/mnt/c/" main.ts src manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
```

## Navigator Validation

1. Reload Relationship CRM in the test vault.
2. Create a company.
3. Create a person linked to that company.
4. Confirm company note has the person link under `## Pessoas`.
5. Create an opportunity linked to that company/person.
6. Confirm company note has the opportunity link under `## Oportunidades`.
7. Confirm opportunity note body includes linked company/contact sections.
8. Log an interaction linked to person/company/opportunity.
9. Confirm related notes have the interaction link under `## Histórico`.
10. Repeat or reprocess and confirm links are not duplicated.

## Validation Evidence

Implementation evidence captured on 2026-07-05:

- `npm run build` completed successfully.
- Source/config forbidden-behavior scan returned no matches.
- Updated plugin artifacts were copied to the test vault plugin folder.

Manual Obsidian validation remains pending Navigator confirmation.
