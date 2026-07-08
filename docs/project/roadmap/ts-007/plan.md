# Plan — TS-007

## Objective

Add the first interaction-loop slice: create durable interaction Markdown notes under `CRM/Interactions` linked to existing CRM records.

MVP source of truth:

`MVP.md` (private product contract, outside this repository)

Relevant MVP sections:

- Fluxo principal da v0.1
- Entidades / Interação
- Comandos / Log interaction

## Scope

Implement `Log interaction` command.

The command should collect, through simple UI:

- interaction kind;
- related person/contact from existing CRM people;
- related company from existing CRM companies;
- related opportunity from existing CRM opportunities;
- summary;
- outcome;
- next action;
- next action date.

It should create a Markdown file under:

```text
CRM/Interactions/
```

Filename pattern:

```text
YYYY-MM-DD - {kind} - {primary person or company}.md
```

The interaction frontmatter should include:

```yaml
type: crm/interaction
crm_id: interaction-...
date: YYYY-MM-DD
kind: call|meeting|email|whatsapp|linkedin|note|other
people:
  - "[[Person]]"
company: "[[Company]]"
opportunity: "[[Opportunity]]"
outcome: ...
next_action: ...
next_action_date: YYYY-MM-DD
tags:
  - crm/interaction
```

The body should include:

```md
# interaction title

## Resumo

## Pontos importantes

## Compromissos

## Próxima ação
```

## Non-Goals

- Updating `last_contact` on related records.
- Updating `next_action` / `next_action_date` on related records.
- Generating Markdown follow-up tasks.
- Attention dashboard.
- Pipeline behavior.
- Creating missing related entities inside Log interaction.
- IA features.
- Network calls.
- Telemetry or analytics.
- Backend, login, sync, or external integrations.

## Acceptance Behavior

```text
Given CRM people, companies, and opportunities exist
When the user runs Log interaction and selects related records
Then an interaction Markdown file is created under CRM/Interactions
And it contains type crm/interaction frontmatter
And selected related records are stored as wikilinks
```

```text
Given the user provides summary, outcome, next action, and next action date
When the interaction note is created
Then those values appear in frontmatter and/or body
```

```text
Given the user does not select optional related records
When the interaction note is created
Then the missing optional relationships remain empty rather than unresolved wikilinks
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
2. Ensure at least one person, company, and opportunity exist.
3. Run `Log interaction`.
4. Select existing person, company, and opportunity.
5. Fill summary, outcome, next action, and next action date.
6. Confirm a note is created under `CRM/Interactions`.
7. Confirm frontmatter uses `type: "crm/interaction"` and links selected records.
8. Confirm no related records were updated yet.
9. Confirm no follow-up task was generated yet.

Pass condition:

- interaction note is created in the correct folder;
- frontmatter and body preserve the entered interaction data;
- selected related entities are valid wikilinks;
- optional missing relations do not become unresolved wikilinks;
- build passes;
- no forbidden behavior is introduced.

Fail condition:

- interaction note is missing or created outside `CRM/Interactions`;
- frontmatter type is missing or wrong;
- selected related entities are not linked;
- missing optional values become unresolved wikilinks;
- related entity metadata is updated prematurely;
- follow-up task is generated prematurely;
- build fails.

## Implementation Contract

- Keep changes scoped to `TS-007`.
- Reuse existing repository and frontmatter helpers.
- Use Obsidian vault APIs.
- Do not update related records yet.
- Do not generate tasks yet.
- Keep UI simple.

## Stop Conditions

- Log interaction starts requiring related-record updates.
- Task generation becomes necessary to validate this story.
- UI complexity exceeds simple modal/select fields.
- schema decision conflicts with MVP.md.
- build_fails_without_clear_fix.
- navigator_decision_needed.

## Approval Gate

- active checkpoint: `after_plan`
- pending confirmation: `navigator_approval`
- implementation remains blocked until Navigator approval.
