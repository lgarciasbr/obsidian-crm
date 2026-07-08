# Plan — TS-002

## Objective

Add the minimal settings model and CRM folder foundation required by the MVP before entity creation begins.

MVP source of truth:

`MVP.md` (private product contract, outside this repository)

Relevant MVP sections:

- Estrutura padrão no vault
- Configuração inicial
- APIs do Obsidian a usar
- Restrições técnicas
- Plano de implementação / Fase 1 — Data foundation

## Scope

Implement only the foundation needed to ensure the configured CRM folder structure exists.

Required settings defaults:

```ts
crmRoot: "CRM"
defaultFollowupDays: 7
coolingThresholdDays: 60
createTasksByDefault: true
taskTag: "#crm/follow-up"
```

Required vault folder structure:

```text
CRM/
  People/
  Companies/
  Opportunities/
  Interactions/
```

Implementation should include:

- settings type and defaults;
- `loadSettings` / `saveSettings` behavior;
- minimal settings tab if useful for changing `crmRoot` now;
- folder constants/helpers;
- helper to ensure the CRM root and base folders exist using Obsidian vault APIs;
- command or load-time-safe route to initialize folders for validation.

## Non-Goals

- Create person/company/opportunity files.
- Add entity modals.
- Log interactions.
- Generate follow-up tasks.
- Implement real dashboard behavior.
- Implement opportunity pipeline behavior.
- Add IA features.
- Add network calls.
- Add telemetry or analytics.
- Add backend, login, sync, or external integrations.
- Use Node `fs` or absolute system paths.

## Acceptance Behavior

```text
Given the plugin is enabled with default settings
When the folder foundation is initialized
Then `CRM/`, `CRM/People/`, `CRM/Companies/`, `CRM/Opportunities/`, and `CRM/Interactions/` exist in the vault
```

```text
Given a user changes `crmRoot` in plugin settings
When the folder foundation is initialized
Then the base CRM folders are created under the configured root
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
- enable/reload Relationship CRM;
- run the folder initialization route;
- expected observation: the configured CRM folder tree appears in the test vault.

Pass condition:

- required CRM folders exist under the configured root;
- build passes;
- no forbidden behavior is introduced.

Fail condition:

- folders are missing or created outside the configured root;
- build fails;
- implementation introduces forbidden behavior or non-MVP scope.

## Implementation Contract

- Keep changes scoped to `TS-002`.
- Use Obsidian vault APIs for folder creation.
- Do not use Node filesystem APIs.
- Do not create CRM records yet.
- Keep folder creation idempotent.
- Do not expand into entity commands.

## Stop Conditions

- scope_change_detected
- folder_creation_requires_non_Obsidian_filesystem_API
- settings_design_expands_beyond_MVP_defaults
- build_fails_without_clear_fix
- navigator_decision_needed

## Approval Gate

- active checkpoint: `after_plan`
- pending confirmation: `navigator_approval`
- implementation remains blocked until Navigator approval.
