# Plan — TS-004

## Objective

Refactor the current data foundation code into focused modules before adding metadata repository reading, preserving the validated TS-003 behavior exactly.

MVP source of truth:

`MVP.md` (private product contract, outside this repository)

Debt trigger from TS-003:

Before implementing interaction logging or metadata repository reading, extract settings, entity creation, frontmatter, filename helpers, and modal code into focused modules.

## Scope

Split responsibilities currently concentrated in `main.ts` into focused files:

```text
src/
  settings.ts
  constants.ts
  ui/
    entity-modal.ts
    setting-tab.ts
  crm/
    folders.ts
    entity-creation.ts
    frontmatter.ts
    file-names.ts
    dates.ts
    types.ts
```

Keep `main.ts` responsible for plugin wiring only:

- load settings;
- register setting tab;
- register commands;
- delegate behavior to modules.

Preserve existing commands and behavior:

- `Open CRM dashboard` placeholder;
- `Initialize CRM folders`;
- `Create person`;
- `Create company`;
- `Create opportunity`.

## Non-Goals

- New CRM behavior.
- Metadata repository reading.
- Interaction logging.
- Dashboard implementation.
- Pipeline implementation.
- Schema expansion beyond existing TS-003 fields.
- UI redesign.
- IA features.
- Network calls.
- Telemetry or analytics.
- Backend, login, sync, or external integrations.

## Acceptance Behavior

```text
Given TS-003 behavior works before the refactor
When the code is modularized
Then Create person, Create company, Create opportunity, Initialize CRM folders, and Open CRM dashboard still work as before
```

```text
Given the refactor introduces focused modules
When main.ts is inspected
Then it contains plugin orchestration but not frontmatter rendering, filename sanitization, modal implementation, or entity body construction details
```

```text
Given the MVP forbids IA, network, telemetry, backend, and desktop-only dependencies
When the implementation is inspected
Then no intentional forbidden behavior has been introduced
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

- deploy plugin artifacts to the test vault;
- reload/enable Relationship CRM;
- run `Initialize CRM folders`;
- run `Create person`;
- run `Create company`;
- run `Create opportunity`;
- confirm files are created with expected frontmatter as in TS-003.

Pass condition:

- behavior remains unchanged from TS-003;
- build passes;
- `main.ts` is reduced to orchestration;
- no forbidden behavior is introduced.

Fail condition:

- any existing command disappears or breaks;
- entity files are no longer created correctly;
- frontmatter changes unexpectedly;
- build fails;
- refactor introduces forbidden behavior or non-MVP scope.

## Implementation Contract

- Keep changes behavior-preserving.
- Do not add new user-facing capability.
- Prefer small focused modules over premature abstraction.
- Do not add dependencies.
- Preserve current manual validation path.

## Stop Conditions

- behavior_change_detected
- module_split_expands_scope
- new_dependency_needed
- build_fails_without_clear_fix
- navigator_decision_needed

## Approval Gate

- active checkpoint: `after_plan`
- pending confirmation: `navigator_approval`
- implementation remains blocked until Navigator approval.
