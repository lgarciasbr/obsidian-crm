# Plan — TS-010

## Objective

Replace the placeholder `Open CRM dashboard` command with an MVP Attention Dashboard generated from local CRM Markdown/frontmatter.

MVP source of truth:

`MVP.md` (private product contract, outside this repository)

Relevant MVP sections:

- `Open attention dashboard`
- `Views / Attention Dashboard`
- `CA8 — Dashboard útil`
- `PA3 — Valor percebido`

## Scope

Implement the smallest useful dashboard surface:

- command: keep using existing `Open CRM dashboard` command;
- UI: open an Obsidian modal or view showing dashboard sections;
- data source: existing Markdown files and `metadataCache` frontmatter via Obsidian APIs;
- sections:
  - `Overdue` — records with `next_action_date < today`;
  - `Today` — records with `next_action_date == today`;
  - `Next 7 days` — records with `next_action_date` after today and within 7 days;
  - `No next action` — open opportunities without `next_action_date`;
  - `Cooling relationships` — active people/companies with `last_contact` older than `settings.coolingThresholdDays`.
- list items should show enough context to act:
  - record name;
  - next action when present;
  - date/age when relevant;
  - record type label when helpful.
- listed records should be openable by click when practical.

## Non-Goals

- Opportunity pipeline.
- Charts or analytics.
- Drag-and-drop.
- Custom dashboard configuration.
- Task completion sync.
- Daily Note integration.
- Set next action command.
- IA features.
- Network calls.
- Telemetry or analytics.
- Backend, login, sync, or external integrations.

## Acceptance Behavior

```text
Given CRM records have next_action_date values
When the user runs Open CRM dashboard
Then overdue, today, and next 7 days sections show matching records
```

```text
Given an open opportunity has no next_action_date
When the user runs Open CRM dashboard
Then it appears under No next action
```

```text
Given an active person/company has last_contact older than the configured cooling threshold
When the user runs Open CRM dashboard
Then it appears under Cooling relationships
```

```text
Given a listed dashboard item is clicked
When the record file exists
Then Obsidian opens the underlying CRM note
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
2. Ensure the test vault has CRM records covering:
   - overdue next action;
   - today next action;
   - next 7 days action;
   - open opportunity without next action date;
   - active person/company older than cooling threshold.
3. Run `Open CRM dashboard`.
4. Confirm each expected section shows the matching records.
5. Click at least one item and confirm the CRM note opens.

Pass condition:

- the dashboard opens without errors;
- each MVP section is visible;
- records are categorized by the MVP rules;
- clicking a listed item opens its note when possible;
- build passes;
- no forbidden behavior is introduced.

Fail condition:

- command still only shows placeholder notice;
- dashboard omits an MVP section;
- records appear in the wrong section;
- listed records cannot be opened when files exist;
- build fails;
- forbidden behavior or non-MVP scope is introduced.

## Implementation Contract

- Keep changes scoped to TS-010.
- Prefer a small reusable dashboard module under `src/views/`.
- Use Obsidian APIs only.
- Keep frontmatter as source of truth.
- Reuse existing repository patterns when possible; extend only as needed.
- Do not implement pipeline behavior in this story.

## Stop Conditions

- dashboard design requires a custom rendering framework;
- MVP dashboard rules conflict with existing generated frontmatter;
- implementation requires network, external plugin APIs, or non-local storage;
- build_fails_without_clear_fix;
- navigator_decision_needed.

## Approval Gate

- active checkpoint: `after_plan`
- pending confirmation: `navigator_approval`
- implementation remains blocked until Navigator approval.
