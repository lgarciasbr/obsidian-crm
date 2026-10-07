# Plan — TS-011

## Objective

Plan the smallest coherent, testable slice for TS-011.

## Scope

- Deliver TS-011 as an observable slice.
- Keep the implementation narrow enough to validate at the Plan-defined checkpoint.

## Non-Goals

- Do not silently absorb adjacent roadmap work.

## Acceptance Behavior

```text
Given the starting state needed for TS-011
When the Navigator exercises TS-011
Then the planned observable behavior is visible
And out-of-scope sibling roadmap items remain untouched
```

## Validation Route

- Run automated tests that cover the planned behavior.
- Provide a Navigator-visible route with expected observation, pass condition, and fail condition.

E2E decision: required unless Navigator explicitly accepts a narrower fixture-level validation route

## Implementation Contract

- Use TDD or characterization tests for behavior changes when testable.
- Keep changes scoped to `TS-011`.
- Use uv run for Python commands and tests.
- Do not use git add .; commit only story-scoped files.
- Use descriptive English commit messages explaining why.

## Stop Conditions

- scope_change_detected
- plan_rule_conflict
- failing_required_check_without_clear_fix
- navigator_decision_needed

## Approval Gate

- active checkpoint: `after_plan`
- pending confirmation: `navigator_approval`
- implementation remains blocked until Navigator approval.
