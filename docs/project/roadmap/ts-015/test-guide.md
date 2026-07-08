[< Story](index.md)

# Test Guide — TS-015

## Automated / Local Validation

```bash
npm run build
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(|/home/|/mnt/c/" main.ts src manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
```

## Navigator Validation

1. Reload Relationship CRM in the test vault.
2. In a fresh/empty CRM, open the pipeline.
3. Use pipeline toolbar actions to create person/company.
4. Confirm the pipeline stays open.
5. Use `+ Adicione uma oportunidade` in a stage.
6. Confirm the pipeline stays open and the new card appears in that stage.
7. Confirm BRL values render as Brazilian currency, e.g. `R$ 8.000,00`.
8. Open modals when no related records exist and confirm there is no misleading fake dropdown option.
9. Create related records and confirm they appear in dropdowns after they exist.

## Validation Evidence

Implementation evidence captured on 2026-07-05:

- `npm run build` completed successfully.
- Source/config forbidden-behavior scan returned no matches.
- Updated plugin artifacts were copied to the test vault plugin folder.

Manual Obsidian validation remains pending Navigator confirmation.
