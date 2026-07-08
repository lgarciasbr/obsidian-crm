# Review — TS-003

## Status

Reviewed

## Debt Findings

- main.ts now contains plugin setup, settings UI, entity modals, frontmatter rendering, filename helpers, and entity creation logic. This is acceptable for the early MVP slice but should be split before adding interaction logging or repository/metadata reading.

## Debt Decision

defer

## Defer Reason

Refactoring now would add structure before the next data-foundation needs are fully visible.

## Revisit Trigger

Before implementing interaction logging or metadata repository reading, extract settings, entity creation, frontmatter, filename helpers, and modal code into focused modules.

## Missing Decision

- none
