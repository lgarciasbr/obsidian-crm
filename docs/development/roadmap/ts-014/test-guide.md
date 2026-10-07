[< Story](index.md)

# Test Guide — TS-014

## Automated / Local Validation

```bash
npm run build
rg "dashboard|AttentionDashboard|open-crm-dashboard" main.ts src manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(|/home/|/mnt/c/" main.ts src manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
```

## Navigator Validation

1. Reload Relationship CRM in the test vault.
2. Confirm `Open CRM dashboard` no longer appears in the command palette.
3. Open a CRM person note and run `Set next action`.
4. Confirm `next_action` and `next_action_date` update in frontmatter.
5. Confirm a Markdown task is appended when task creation is enabled.
6. Repeat on company and opportunity notes.
7. Run `Set next action` on a non-CRM note and confirm a notice appears and the note is not modified.

## Validation Evidence

Implementation evidence captured on 2026-07-05:

- `npm run build` completed successfully.
- Dashboard references scan returned no matches.
- Source/config forbidden-behavior scan returned no matches.
- Updated plugin artifacts were copied to the test vault plugin folder.

Manual Obsidian validation remains pending Navigator confirmation.
