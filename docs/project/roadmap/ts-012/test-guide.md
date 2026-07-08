[< Story](index.md)

# Test Guide — TS-012

## Automated / Local Validation

```bash
npm run build
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(|/home/|/mnt/c/" main.ts src manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
```

## Navigator Validation

1. Reload/enable Relationship CRM in the test vault.
2. Open these commands:
   - `Create person`;
   - `Create company`;
   - `Create opportunity`;
   - `Log interaction`.
3. Confirm modal titles, labels, validation copy, and submit buttons are in PT-BR.
4. Confirm `Log interaction` is grouped into:
   - Relação;
   - Interação;
   - Próximo passo.
5. Confirm related-record fields still show existing selection and `Ou criar novo` input.
6. Submit each modal with valid test data.
7. Confirm CRM notes/frontmatter are created or updated as before.

## Validation Evidence

Implementation evidence captured on 2026-07-04:

- `npm run build` completed successfully.
- Source/config forbidden-behavior scan returned no matches.
- Updated plugin artifacts were copied to the test vault plugin folder.

Manual Obsidian validation remains pending Navigator confirmation.
