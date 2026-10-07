[< Story](index.md)

# Test Guide — TS-013

## Automated / Local Validation

```bash
npm run build
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(|/home/|/mnt/c/" main.ts src manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
```

## Navigator Validation

1. Reload/enable Relationship CRM in the test vault.
2. Open `CRM/Pipeline.md`.
3. Confirm `CRM/Pipeline.md` frontmatter contains `stages`.
4. Confirm columns render in the order from `stages`.
5. Drag a card to another column.
6. Confirm the opportunity note frontmatter `stage` is updated.
7. Drag a column to another position.
8. Reopen/reload the pipeline and confirm the column order persists in `CRM/Pipeline.md` frontmatter.
9. Open `Create opportunity` and confirm the `Etapa` dropdown uses the `Pipeline.md` stages.

## Validation Evidence

Implementation evidence captured on 2026-07-05:

- `npm run build` completed successfully.
- Source/config forbidden-behavior scan returned no matches.
- Updated plugin artifacts were copied to the test vault plugin folder.

Manual Obsidian validation remains pending Navigator confirmation.
