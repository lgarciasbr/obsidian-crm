[< Parent](index.md)

# TS-007 — Create Interaction Notes

**Status:** 🟡 Planned
**Type:** Technical Story

---

## MVP Source

Derived from these sections of the private MVP contract (`MVP.md`):

- Main v0.1 flow
- Entities / Interaction
- Commands / Log interaction

## Technical Story

In order to start the post-interaction CRM loop,
As a solo professional,
I want to log an interaction as a Markdown note linked to existing CRM records,
So that conversations become durable CRM history inside the vault.

## Outcome

The plugin can create an interaction note under `CRM/Interactions` with MVP-compatible frontmatter and links to selected person, company, and opportunity records.

## Acceptance Behavior

```text
Given CRM people/companies/opportunities exist
When the user runs Log interaction and selects related records
Then an interaction Markdown file is created under CRM/Interactions
And its frontmatter includes type crm/interaction, date, kind, people, company, opportunity, outcome, next_action, and next_action_date
```

## Scope

- Add `Log interaction` command.
- Add simple modal for kind, people/contact, company, opportunity, summary/outcome, next action, next action date.
- Use existing repository records for selection.
- Create interaction Markdown note under `CRM/Interactions`.
- Link only selected/existing records; no automatic follow-up metadata update yet.

## Out Of Scope

- Updating related person/company/opportunity frontmatter.
- Generating follow-up task.
- Attention dashboard.
- Pipeline behavior.
- IA, network, telemetry, backend, login, sync, or external integrations.

## Validation

- Build passes.
- Manual validation creates an interaction note with expected frontmatter and body.
- Source/config scan confirms no forbidden behavior was introduced.
