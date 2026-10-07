[< Story](index.md)

# Test Guide — TS-010

## Automated / Local Validation

```bash
npm run build
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(|/home/|/mnt/c/" main.ts src manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
```

## Navigator Validation

1. Reload/enable Relationship CRM in the test vault.
2. Ensure CRM records exist for:
   - overdue `next_action_date`;
   - today's `next_action_date`;
   - a `next_action_date` within the next 7 days;
   - open opportunity without `next_action_date`;
   - active person/company with `last_contact` older than the cooling threshold.
3. Run `Open CRM dashboard`.
4. Confirm these sections are visible:
   - `Overdue`;
   - `Today`;
   - `Next 7 days`;
   - `No next action`;
   - `Cooling relationships`.
5. Confirm records appear in the expected section.
6. Click at least one listed record and confirm the CRM note opens.

## Validation Evidence

Implementation evidence captured on 2026-07-04:

- `npm run build` completed successfully.
- Source/config forbidden-behavior scan returned no matches.
- Updated plugin artifacts were copied to the test vault plugin folder.

Manual Obsidian validation remains pending Navigator confirmation.
