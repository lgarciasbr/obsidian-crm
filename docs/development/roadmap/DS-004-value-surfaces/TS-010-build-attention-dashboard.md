[< Parent](index.md)

# TS-010 — Build Attention Dashboard

**Status:** 🟡 Planned
**Type:** Technical Story

---

## MVP Source

Derived from these sections of the private MVP contract (`MVP.md`):

- Views / Attention Dashboard
- Commands / Open attention dashboard
- Technical acceptance criteria CA8
- Product acceptance criteria PA3

## Technical Story

In order to know what needs attention now,
As a solo professional,
I want an Attention Dashboard generated from CRM frontmatter,
So that overdue follow-ups, today's actions, upcoming actions, missing next actions, and cooling relationships are visible without writing Dataview queries.

## Outcome

The existing `Open CRM dashboard` command opens a useful MVP Attention Dashboard from CRM records.

## Acceptance Behavior

```text
Given CRM records have next_action_date values
When the user opens the dashboard
Then overdue, today, and next 7 days sections show matching records
```

```text
Given an open opportunity has no next_action_date
When the user opens the dashboard
Then it appears under No next action
```

```text
Given an active person/company has last_contact older than the cooling threshold
When the user opens the dashboard
Then it appears under Cooling relationships
```

## Scope

- Replace placeholder dashboard command with a real view or modal.
- Read CRM records via existing repository/metadata patterns.
- Show sections: Overdue, Today, Next 7 days, No next action, Cooling relationships.
- Let users click/open listed records when practical.

## Out Of Scope

- Opportunity pipeline.
- Charts/analytics.
- Custom dashboard configuration.
- Task completion sync.
- IA, network, telemetry, backend, login, sync, or external integrations.

## Validation

- Build passes.
- Manual validation with test records confirms each dashboard section works.
- Source/config scan confirms no forbidden behavior was introduced.
