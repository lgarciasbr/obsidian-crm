[< Parent](index.md)

# TS-009 — Generate Markdown Follow-up Tasks

**Status:** 🟡 Planned
**Type:** Technical Story

---

## MVP Source

Derived from `MVP.md` sections:

- Comandos / Log interaction
- Comandos / Set next action
- Critérios de aceite técnicos CA7
- Critérios de aceite de produto PA1

Builds on TS-007 and TS-008.

## Technical Story

In order to make next actions actionable inside Obsidian,
As a solo professional,
I want Log interaction to generate a Markdown follow-up task,
So that follow-ups appear in task-based workflows while remaining local-first Markdown.

## Outcome

When an interaction is logged with next action and next action date, the interaction note includes a Tasks-compatible Markdown checkbox task.

## Acceptance Behavior

```text
Given Log interaction has next_action and next_action_date
When the interaction note is created
Then the note body includes a Markdown task with the next action, due date, and CRM follow-up tag
```

## Scope

- Generate Markdown task in the interaction note body when next action exists.
- Include due date when next action date exists.
- Include configured task tag from settings.
- Keep existing interaction note and related metadata update behavior.

## Out Of Scope

- Separate Set next action command.
- Dashboard behavior.
- Pipeline behavior.
- Tasks plugin dependency.
- Recurring tasks.
- Task completion sync back to CRM metadata.
- IA, network, telemetry, backend, login, sync, or external integrations.

## Validation

- Build passes.
- Manual validation confirms interaction note includes the expected Markdown task.
- Source/config scan confirms no forbidden behavior was introduced.
