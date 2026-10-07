[< Parent](../index.md)

# TS-004 — Modularize Data Foundation Code

**Status:** 🟩 Done
**Type:** Technical Story

---

## MVP Source

Derived from the TS-003 Debt Review trigger and `MVP.md` implementation constraints:

- Obsidian APIs to use
- Technical constraints
- Implementation plan / Phase 1 — Data foundation

Source file:

`MVP.md` (private product contract, outside this repository)

## Outcome

Existing validated entity creation behavior remains unchanged while settings, entity creation, frontmatter rendering, filename helpers, folder helpers, and modal code are split out of `main.ts` into focused modules.

## Story Statement

In order to safely add repository/metadata reading,
As the plugin codebase,
I want the current data foundation code split into focused modules,
So that future CRM behavior can be added without growing `main.ts` into an unsafe mixed-responsibility file.

## Acceptance Behavior

```text
Given TS-003 behavior works before the refactor
When the code is modularized
Then Create person, Create company, Create opportunity, Initialize CRM folders, and Open CRM dashboard still work as before
```

## Scope

- Extract settings types/defaults/settings tab.
- Extract folder constants/helpers.
- Extract entity creation logic.
- Extract frontmatter/filename/date helpers.
- Extract reusable entity modal.
- Keep `main.ts` as plugin wiring/orchestration.
- Preserve existing behavior exactly.

## Out Of Scope

- New CRM behavior.
- Metadata repository reading.
- Interaction logging.
- Dashboard implementation.
- Pipeline implementation.
- IA, network, telemetry, backend, login, sync, or external integrations.

## Validation

- Run `npm run build`.
- Deploy to test vault.
- Re-run TS-003 manual validation path.
- Inspect source/config for forbidden behavior.

---

## Artifacts

- [Plan](plan.md)
- [Test Guide](test-guide.md)
