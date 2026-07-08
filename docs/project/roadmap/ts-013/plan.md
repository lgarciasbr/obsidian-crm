# Plan — TS-013

## Objective

Make the MVP pipeline behave more like an Obsidian Kanban-style board while remaining local-first and independent from the Kanban plugin.

## Scope

Implement the smallest coherent Kanban-style editing slice:

1. `CRM/Pipeline.md` stores the pipeline stages in frontmatter.
2. Pipeline rendering reads stages from `CRM/Pipeline.md`.
3. `Create opportunity` stage dropdown reads options from `CRM/Pipeline.md`.
4. Drag-and-drop cards between columns updates opportunity `stage` frontmatter.
5. Drag-and-drop columns reorders the stage list and persists it back to `CRM/Pipeline.md`.

Default `CRM/Pipeline.md` frontmatter:

```yaml
---
type: crm/pipeline
stages:
  - lead
  - conversation
  - proposal
  - negotiation
  - won
  - lost
  - paused
---
```

## Non-Goals

- Depend on `obsidian-kanban`.
- Import or generate Obsidian Kanban plugin syntax.
- Multiple pipelines.
- WIP limits.
- Archive behavior.
- Card templates.
- Complex drag ghost/animation polish.
- Network, telemetry, IA, backend, login, sync, or external integrations.

## Acceptance Behavior

```text
Given CRM/Pipeline.md has a stages list
When the pipeline opens
Then columns render in that order
```

```text
Given the user opens Create opportunity
When the stage dropdown renders
Then options come from CRM/Pipeline.md
```

```text
Given the user drags an opportunity card to another column
When the card is dropped
Then the opportunity frontmatter stage is updated and the card appears in the new column
```

```text
Given the user drags a column to another position
When the column is dropped
Then CRM/Pipeline.md stages order is updated and persists after reload
```

## Validation Route

Automated/local checks:

- `npm run build`
- forbidden-behavior scan for network/telemetry/IA/backend/Node filesystem/process APIs/absolute paths.

Navigator-visible manual route:

1. Reload Relationship CRM in test vault.
2. Open `CRM/Pipeline.md`.
3. Confirm stages render from `CRM/Pipeline.md`.
4. Reorder a column; reload pipeline; confirm order persists.
5. Drag a card to another column; confirm opportunity note frontmatter `stage` changes.
6. Open `Create opportunity`; confirm stage dropdown matches `CRM/Pipeline.md` order/options.
7. Create an opportunity in a selected stage and confirm it appears in the matching column.

Pass condition:

- stage list source of truth is `CRM/Pipeline.md`;
- card drag updates opportunity stage;
- column drag updates pipeline stages order;
- create opportunity uses pipeline stages;
- build passes;
- no forbidden behavior is introduced.

Fail condition:

- stages remain hardcoded;
- card drag does not persist frontmatter;
- column drag does not persist `Pipeline.md`;
- create opportunity dropdown does not follow pipeline stages;
- build fails;
- forbidden behavior or dependency on Kanban plugin is introduced.

## Implementation Contract

- Keep Markdown/frontmatter as the source of truth.
- Use Obsidian APIs only.
- Prefer native HTML drag/drop for MVP.
- Keep the current visual style of cards/columns unless required for drag usability.
- Preserve existing pipeline interactions: open opportunity, open company/person, create interaction, add opportunity per column.

## Approval Gate

- active checkpoint: `after_plan`
- pending confirmation: `navigator_approval`
- implementation remains blocked until Navigator approval.
