[< Parent](../index.md)

# TS-021 — Commands, Settings and Test Coverage Review

**Status:** 🟩 Done
**Type:** Technical Story

---

## Outcome

- Commands no longer repeat the plugin name (Obsidian shows `CRM: <command>`): `Open`, `Initialize folders`, `Create person`, `Create company`, `Create opportunity`, `Log interaction`, `Set next action` (only on person/company/opportunity notes), `Validate data`.
- Settings: no redundant heading; dead options from the removed dashboard dropped; follow-up task toggle and tag exposed; Log interaction respects the toggle.
- Pipeline stage and money rules extracted from the view into `src/crm/pipeline.ts`.

## Bugs Fixed

- Set next action added a new `## Next action` heading each time the action changed.
- Stages created with capitals made their opportunities fail validation.
- Amounts with a dot decimal mark were misread (`1000.50` → 100050).

## Tests

49 tests (`npm test`): pure rules (sections, frontmatter, pipeline, money/date, validator), and Node integration tests of every write flow against an in-memory Obsidian — including contract rules R1/R2, card-launched interactions, file-name collisions, and a check that everything the flows write passes the validator.

Not covered: rendering and drag-and-drop wiring in the view, and the modal UI itself; those still need a manual check in Obsidian.
