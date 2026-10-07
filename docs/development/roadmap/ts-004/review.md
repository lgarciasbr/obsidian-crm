# Review — TS-004

## Status

Reviewed

## Debt Findings

- Dangling entity links can be created when a person, company, or opportunity references a name that does not correspond to an existing CRM entity file. Obsidian then creates a new Markdown note at the vault root when the user clicks the unresolved link, instead of linking to a CRM-managed record under CRM/People, CRM/Companies, or CRM/Opportunities. This is a data integrity and UX debt for entity relationship handling.

## Debt Decision

defer

## Defer Reason

Fixing this properly requires entity lookup/selection behavior and belongs with the upcoming metadata repository reading work rather than the TS-004 behavior-preserving refactor.

## Revisit Trigger

Before or during TS-005 metadata repository reading, implement or plan entity resolution rules so relationship fields link to existing CRM records, offer creation when missing, or avoid unresolved wikilinks that create root-level notes.

## Missing Decision

- none
