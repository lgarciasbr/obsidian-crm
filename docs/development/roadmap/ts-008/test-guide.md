[< Story](index.md)

# Test Guide — TS-008

## Automated / Local Validation

```bash
npm run build
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(" main.ts src manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
```

## Navigator Validation

1. Reload/enable Relationship CRM in the test vault.
2. Ensure one person, company, and opportunity exist.
3. Run `Log interaction`.
4. Select person, company, and opportunity.
5. Fill date, next action, and next action date.
6. Confirm the interaction note exists under `CRM/Interactions`.
7. Confirm selected person/company/opportunity frontmatter now includes:

```yaml
last_contact: <interaction date>
next_action: <entered next action>
next_action_date: <entered next action date>
```

8. Confirm no Markdown task was generated yet.

## Validation Evidence

Implementation evidence captured on 2026-07-04:

- `npm run build` completed successfully.
- Source/config forbidden-behavior scan returned no matches.
- Updated plugin artifacts were copied to the test vault plugin folder.

Manual Obsidian validation remains pending Navigator confirmation.
