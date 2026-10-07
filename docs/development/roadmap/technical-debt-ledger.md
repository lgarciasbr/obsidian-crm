# Technical Debt Ledger

Ariad Review records technical debt here when debt should be paid now or deferred.

| ID | Source Story | Location | Kind | Description | Impact | Recommendation | Navigator Decision | Status |
|----|--------------|----------|------|-------------|--------|----------------|--------------------|--------|
| TD-001 | TS-011 | `src/views/opportunity-pipeline.ts`, interaction/follow-up model | Product/logic debt | Pipeline displays `next_action` and `next_action_date` from the opportunity frontmatter only. It does not derive the next action by scanning multiple interaction notes or follow-up tasks. | If multiple future actions exist for the same opportunity, the pipeline may not show the chronologically nearest action unless the opportunity frontmatter was updated to that state. | Keep for MVP. Later define a single follow-up resolution model: source records, date ordering, tie-breaker for same-day actions, and whether completed Markdown tasks are ignored. | Deferred by Navigator request | Deferred |

## Deferred Debt Requirements

When debt is deferred, record the defer reason and revisit trigger.
