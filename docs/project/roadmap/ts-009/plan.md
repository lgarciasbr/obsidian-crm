# Plan — TS-009

## Objective

Generate a local Markdown follow-up task inside the interaction note when `Log interaction` includes a next action.

MVP source of truth:

`MVP.md` (private product contract, outside this repository)

Relevant MVP sections:

- Comandos / Log interaction
- Critérios de aceite técnicos CA7
- Critérios de aceite de produto PA1

## Scope

When `Log interaction` creates an interaction note:

- if `next_action` exists, add a Markdown task under `## Próxima ação`;
- if `next_action_date` exists, include due date using Tasks-compatible syntax;
- include the configured task tag from settings;
- keep existing frontmatter metadata and related record updates from TS-007/TS-008.

Task format:

```md
- [ ] Fazer follow-up com [[Maria Souza]] 📅 2026-07-10 #crm/follow-up
```

If no `next_action_date` exists:

```md
- [ ] Fazer follow-up com [[Maria Souza]] #crm/follow-up
```

If no `next_action` exists:

- do not generate a task.

## Non-Goals

- Separate Set next action command.
- Attention dashboard.
- Pipeline behavior.
- Tasks plugin dependency.
- Task completion sync back to CRM metadata.
- Recurring tasks.
- IA features.
- Network calls.
- Telemetry or analytics.
- Backend, login, sync, or external integrations.

## Acceptance Behavior

```text
Given Log interaction has next_action and next_action_date
When the interaction note is created
Then the body includes a Markdown checkbox task with action, due date, and CRM follow-up tag
```

```text
Given Log interaction has next_action but no next_action_date
When the interaction note is created
Then the body includes a Markdown checkbox task with action and CRM follow-up tag, without due date
```

```text
Given Log interaction has no next_action
When the interaction note is created
Then no empty Markdown task is generated
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
2. Run `Log interaction` with a next action and next action date.
3. Confirm the interaction note includes a task like:

```md
- [ ] <next action> 📅 <next_action_date> #crm/follow-up
```

4. Run `Log interaction` with a next action and no next action date.
5. Confirm task exists without due date.
6. Run `Log interaction` without next action.
7. Confirm no empty task is generated.

Pass condition:

- task is generated only when next action exists;
- due date is included only when next action date exists;
- configured tag is included;
- build passes;
- no forbidden behavior is introduced.

Fail condition:

- task is missing when next action exists;
- empty task is generated without next action;
- due date syntax is wrong;
- configured tag is missing;
- build fails;
- implementation introduces forbidden behavior or non-MVP scope.

## Implementation Contract

- Keep changes scoped to `TS-009`.
- Do not add dependency on Tasks plugin.
- Generate plain Markdown only.
- Preserve TS-007 and TS-008 behavior.
- Use settings `taskTag`.

## Stop Conditions

- task syntax conflicts with MVP.md;
- task generation requires external plugin APIs;
- behavior starts syncing task completion back to CRM;
- build_fails_without_clear_fix;
- navigator_decision_needed.

## Approval Gate

- active checkpoint: `after_plan`
- pending confirmation: `navigator_approval`
- implementation remains blocked until Navigator approval.
