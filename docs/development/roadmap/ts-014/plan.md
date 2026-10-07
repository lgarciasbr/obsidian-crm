# Plan — TS-014

## Objective

Remove the rejected dashboard surface and implement the MVP `Set next action` command.

## Scope

### Remove dashboard

- Remove `Open CRM dashboard` command.
- Remove unused Attention Dashboard view/module if no longer referenced.
- Keep pipeline as the primary visual surface.

### Implement Set next action

Add command:

```text
Set next action
```

Behavior:

- works on the active CRM entity note when its frontmatter `type` is one of:
  - `crm/person`
  - `crm/company`
  - `crm/opportunity`
- opens a small modal with:
  - `Próxima ação`
  - `Data da próxima ação`
  - optional checkbox or default behavior for creating a Markdown task if `settings.createTasksByDefault` is true.
- updates active note frontmatter:
  - `next_action`
  - `next_action_date`
- optionally appends a Markdown task in the current note body when configured.

Task format should remain compatible with existing follow-up tasks:

```md
- [ ] Fazer follow-up 📅 2026-07-10 #crm/follow-up
```

## Non-Goals

- Rebuild dashboard.
- Create a new visual task dashboard.
- Scan multiple interactions to calculate next action.
- Task completion sync.
- Daily Note integration.
- Network, telemetry, IA, backend, login, sync, or external integrations.

## Acceptance Behavior

```text
Given the active note is a CRM person/company/opportunity
When the user runs Set next action
Then the modal opens and updates next_action and next_action_date in frontmatter
```

```text
Given task creation is enabled
When the user sets a next action
Then a Markdown task is appended to the note body
```

```text
Given the active note is not a supported CRM entity
When the user runs Set next action
Then the plugin shows a notice and does not modify the note
```

```text
Given the command palette is opened
When the user searches CRM dashboard
Then the rejected dashboard command is no longer available
```

## Validation Route

- `npm run build`
- forbidden-behavior scan
- deploy to test vault
- manually validate:
  1. dashboard command is gone;
  2. `Set next action` works on person;
  3. `Set next action` works on company;
  4. `Set next action` works on opportunity;
  5. unsupported note shows notice;
  6. frontmatter and optional task are correct.

## Approval Gate

Implementation blocked until Navigator approval.
