[< Story](index.md)

# Test Guide — TS-009

## Automated / Local Validation

```bash
npm run build
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(" main.ts src manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
```

## Navigator Validation

1. Reload/enable Relationship CRM in the test vault.
2. Run `Log interaction` with next action and next action date.
3. Confirm the interaction note includes:

```md
- [ ] <next action> 📅 <next_action_date> #crm/follow-up
```

4. Run `Log interaction` with next action and no next action date.
5. Confirm the interaction note includes a task without due date.
6. Run `Log interaction` without next action.
7. Confirm no empty task is generated.

## Validation Evidence

Implementation evidence captured on 2026-07-04:

- `npm run build` completed successfully.
- Source/config forbidden-behavior scan returned no matches.
- Updated plugin artifacts were copied to the test vault plugin folder.

Manual Obsidian validation remains pending Navigator confirmation.
