[< Parent](index.md)

# TS-008 — Update Related Entity Follow-up Metadata

**Status:** 🟡 Planned
**Type:** Technical Story

---

## MVP Source

Derived from `MVP.md` sections:

- Fluxo principal da v0.1
- Comandos / Log interaction
- Comandos / Set next action
- Critérios de aceite de produto PA1

Builds on TS-007 interaction note creation.

## Technical Story

In order to make logged interactions actionable,
As a solo professional,
I want Log interaction to update related CRM records with last contact and next action metadata,
So that people, companies, and opportunities reflect the latest follow-up state.

## Outcome

When an interaction is logged with related records, the plugin updates `last_contact`, `next_action`, and `next_action_date` on selected person, company, and opportunity records when possible.

## Acceptance Behavior

```text
Given a person, company, and opportunity are selected in Log interaction
When the interaction is saved with date, next action, and next action date
Then the selected records have last_contact, next_action, and next_action_date updated in frontmatter
```

```text
Given an optional related record is not selected
When the interaction is saved
Then no unresolved relationship update is attempted for that missing record
```

## Scope

- Resolve selected related records to actual CRM files.
- Use Obsidian frontmatter APIs to update related records.
- Update `last_contact` from interaction date.
- Update `next_action` and `next_action_date` from interaction fields.
- Keep interaction note creation behavior from TS-007.
- Show a notice if a related update fails without losing the interaction note.

## Out Of Scope

- Markdown follow-up task generation.
- Attention dashboard.
- Pipeline behavior.
- Updating body sections like `## Pessoas` or `## Histórico`.
- IA, network, telemetry, backend, login, sync, or external integrations.

## Validation

- Build passes.
- Manual validation confirms selected related records receive updated frontmatter.
- Manual validation confirms interaction note is still created.
- Source/config scan confirms no forbidden behavior was introduced.
