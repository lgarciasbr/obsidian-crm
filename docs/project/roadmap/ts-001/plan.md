# Plan — TS-001

## Objective

Create the smallest loadable Obsidian plugin scaffold for Relationship CRM, aligned with the MVP contract and ready for future CRM behavior.

MVP source of truth:

`MVP.md` (private product contract, outside this repository)

Relevant MVP sections:

- Arquitetura técnica
- Manifest inicial
- Restrições técnicas
- Critérios de aceite técnicos CA1, CA2, CA3, CA9, CA10
- Plano de implementação / Fase 0 — Bootstrap

## Scope

Create the plugin scaffold at the root of this repository.

Required files:

- `manifest.json`
- `package.json`
- `tsconfig.json`
- `esbuild.config.mjs`
- `main.ts`
- `styles.css`
- `versions.json`
- `README.md`
- generated `main.js` after build

The plugin should:

- follow the official Obsidian sample plugin shape;
- use the MVP manifest values for Relationship CRM;
- keep `isDesktopOnly: false`;
- register only minimal load/unload behavior;
- avoid real CRM behavior in this story.

## Non-Goals

- Create person/company/opportunity commands.
- Log interactions.
- Implement the real Attention Dashboard.
- Implement the Opportunity Pipeline.
- Add IA features.
- Add network calls.
- Add telemetry or analytics.
- Add backend, login, sync, or external integrations.
- Add Dataview/Tasks integrations beyond documentation mention.

## Acceptance Behavior

```text
Given the Obsidian-CRM repository exists
When the project dependencies are installed and the build command runs
Then `main.js` is generated without build errors
And `manifest.json` and `styles.css` are present for manual plugin installation
```

```text
Given the generated plugin files are copied into an Obsidian vault plugin folder
When the plugin is enabled in Obsidian
Then the plugin loads without runtime errors
And no CRM behavior beyond minimal plugin load/unload exists yet
```

```text
Given the MVP forbids IA, network, telemetry, backend, and desktop-only dependencies
When the scaffold is inspected
Then no intentional `fetch`, `XMLHttpRequest`, analytics SDK, IA SDK, backend client, Node `fs`, absolute-path, or process-spawning behavior is present
```

## Validation Route

Automated/local checks:

- `npm install`
- `npm run build`
- verify `main.js`, `manifest.json`, and `styles.css` exist
- inspect source for forbidden scaffold behavior:
  - `fetch`
  - `XMLHttpRequest`
  - analytics SDKs
  - IA SDKs
  - backend clients
  - Node `fs`
  - process spawning
  - absolute system paths

Navigator-visible E2E route:

- copy `main.js`, `manifest.json`, and `styles.css` into a test vault under `.obsidian/plugins/relationship-crm/`;
- enable the plugin in Obsidian;
- expected observation: plugin enables without error;
- pass condition: Obsidian shows the plugin as enabled and no runtime error appears;
- fail condition: plugin cannot be enabled, build artifacts are missing, or runtime errors appear on load.

## Implementation Contract

- Keep changes scoped to `TS-001`.
- Do not implement CRM commands or data behavior yet.
- Do not introduce network, telemetry, IA, backend, or desktop-only dependencies.
- Keep files compatible with future Community Plugin release packaging.
- Use descriptive English commit messages if committing later.

## Stop Conditions

- scope_change_detected
- dependency_requires_network_or_desktop_only_behavior
- build_fails_without_clear_fix
- navigator_decision_needed

## Approval Gate

- active checkpoint: `after_plan`
- pending confirmation: `navigator_approval`
- implementation remains blocked until Navigator approval.
