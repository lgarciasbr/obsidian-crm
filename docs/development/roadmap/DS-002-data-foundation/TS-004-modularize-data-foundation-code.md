[< Parent](index.md)

# TS-004 — Modularize Data Foundation Code

**Status:** 🟡 Planned
**Type:** Technical Story

---

## MVP Source

Derived from the TS-003 Debt Review trigger and `MVP.md` implementation constraints:

- Obsidian APIs to use
- Technical constraints
- Implementation plan / Phase 1 — Data foundation

## Technical Story

In order to safely add repository/metadata reading,
As the plugin codebase,
I want the current data foundation code split into focused modules,
So that future CRM behavior can be added without growing `main.ts` into an unsafe mixed-responsibility file.

## Outcome

The existing working behavior remains unchanged while settings, entity creation, frontmatter rendering, filename helpers, and modal code are extracted into focused modules.

## Acceptance Behavior

```text
Given the plugin behavior validated in TS-003
When the code is modularized
Then Create person, Create company, Create opportunity, Initialize CRM folders, and Open CRM dashboard still work as before
```

```text
Given the MVP forbids IA, network, telemetry, backend, and desktop-only dependencies
When the refactor is inspected
Then no forbidden behavior has been introduced
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

- Build passes.
- Existing manual validation route from TS-003 still passes.
- Source/config scan confirms no forbidden behavior was introduced.
