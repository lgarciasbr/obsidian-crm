# Review — TS-011

## Status

Reviewed

## Debt Findings

- Known deferred debt TD-001: pipeline next_action is read from opportunity frontmatter, not derived by scanning multiple interactions/tasks. Additional MVP-acceptable UX debt: view conversion from Pipeline.md is lightweight and may briefly open markdown before switching to visual view.

## Debt Decision

defer

## Defer Reason

Acceptable for MVP; current frontmatter state model is enough to validate product loop.

## Revisit Trigger

Revisit when supporting multiple concurrent follow-up actions per opportunity or when polishing Pipeline.md open behavior to match Kanban plugin internals.

## Missing Decision

- none
