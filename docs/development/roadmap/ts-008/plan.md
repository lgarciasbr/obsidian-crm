# Plan — TS-008

## Objective

Make logged interactions update selected related CRM records with follow-up metadata, without generating Markdown tasks yet.

MVP source of truth:

`MVP.md` (private product contract, outside this repository)

Relevant MVP sections:

- Main v0.1 flow
- Commands / Log interaction
- Commands / Set next action
- Product acceptance criteria PA1

## Scope

When `Log interaction` creates an interaction note, update selected related records when they exist:

- selected person;
- selected company;
- selected opportunity.

Update frontmatter fields:

```yaml
last_contact: <interaction date>
next_action: <interaction next_action>
next_action_date: <interaction next_action_date>
```

Implementation details:

- resolve selected names through the CRM repository;
- update only records that were selected and resolved;
- use Obsidian frontmatter APIs (`processFrontMatter`) for updates;
- create the interaction note even if related update fails;
- show a Notice if one or more related updates fail.

## Non-Goals

- Markdown follow-up task generation.
- Attention dashboard.
- Pipeline behavior.
- Updating body sections like `## Pessoas`, `## Histórico`, or `## Oportunidades`.
- Updating records that were not selected.
- Creating missing related entities from Log interaction.
- IA features.
- Network calls.
- Telemetry or analytics.
- Backend, login, sync, or external integrations.

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

```text
Given one related update fails
When the interaction is saved
Then the interaction note still exists
And the user sees a notice about the failed related update
```

## Validation Route

Automated/local checks:

- `npm run build`
- source/config forbidden-behavior scan for:
  - `fetch`
  - `XMLHttpRequest`
  - analytics SDKs
  - IA SDKs
  - backend clients
  - Node `fs`
  - process spawning
  - absolute system paths

Navigator-visible manual route:

1. Deploy plugin artifacts to the test vault.
2. Ensure one person, one company, and one opportunity exist.
3. Run `Log interaction`.
4. Select person, company, and opportunity.
5. Fill date, next action, and next action date.
6. Confirm the interaction note exists under `CRM/Interactions`.
7. Confirm selected person/company/opportunity frontmatter now includes the interaction date as `last_contact` and the entered next action fields.
8. Confirm no Markdown task was generated yet.

Pass condition:

- interaction note is created;
- selected related records are updated correctly;
- missing optional relations are ignored safely;
- no task is generated;
- build passes;
- no forbidden behavior is introduced.

Fail condition:

- interaction note is lost when related update fails;
- related records are not updated;
- unrelated records are updated;
- task generation happens prematurely;
- build fails;
- implementation introduces forbidden behavior or non-MVP scope.

## Implementation Contract

- Keep changes scoped to `TS-008`.
- Reuse repository resolution.
- Use Obsidian frontmatter APIs.
- Do not generate tasks yet.
- Do not alter related note bodies yet.
- Preserve TS-007 interaction note creation behavior.

## Stop Conditions

- frontmatter update requires schema changes beyond MVP;
- update behavior risks modifying unrelated records;
- task generation becomes necessary to validate the story;
- build_fails_without_clear_fix;
- navigator_decision_needed.

## Approval Gate

- active checkpoint: `after_plan`
- pending confirmation: `navigator_approval`
- implementation remains blocked until Navigator approval.
