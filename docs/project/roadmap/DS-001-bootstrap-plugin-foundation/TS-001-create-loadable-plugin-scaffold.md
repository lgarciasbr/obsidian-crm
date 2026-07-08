[< Parent](index.md)

# TS-001 — Create Loadable Plugin Scaffold

**Status:** 🟡 Planned
**Type:** Technical Story

---

## MVP Source

Derived from `MVP.md` sections:

- Arquitetura técnica
- Manifest inicial
- Critérios de aceite técnicos CA1, CA2, CA3, CA9, CA10
- Plano de implementação / Fase 0 — Bootstrap

## Technical Story

In order to begin implementing the Relationship CRM MVP safely,
As the plugin codebase,
I want a loadable Obsidian plugin scaffold with valid manifest and build configuration,
So that future CRM functionality can be added incrementally under the MVP constraints.

## Outcome

This repository contains the minimal files required to build an Obsidian community plugin candidate.

## Acceptance Behavior

```text
Given the repository has been bootstrapped
When the build command runs
Then it produces plugin artifacts without errors
```

```text
Given the built artifacts are copied into an Obsidian vault plugin folder
When Obsidian enables the plugin
Then the plugin loads without runtime errors
```

## Scope

- Create Obsidian plugin scaffold.
- Add `manifest.json` matching the MVP draft.
- Add `package.json`, TypeScript config, esbuild config, and source entrypoint.
- Keep `isDesktopOnly: false` unless a mobile-breaking dependency appears.
- Avoid network, telemetry, AI, backend, or external service code.

## Out Of Scope

- Creating CRM entities.
- Logging interactions.
- Implementing the real dashboard.
- Implementing the opportunity pipeline.
- Adding AI features.
- Adding network calls.

## Validation

- Build command succeeds.
- `main.js`, `manifest.json`, and `styles.css` exist after build or are present for manual installation.
- Static inspection confirms no intentional `fetch`, `XMLHttpRequest`, telemetry SDK, AI SDK, backend client, `fs`, absolute-path, or process-spawning dependency was introduced.
