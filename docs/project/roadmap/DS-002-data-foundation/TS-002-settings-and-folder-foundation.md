[< Parent](index.md)

# TS-002 — Add Settings and CRM Folder Foundation

**Status:** 🟡 Planned
**Type:** Technical Story

---

## MVP Source

Derived from `MVP.md` sections:

- Estrutura padrão no vault
- APIs do Obsidian a usar
- Restrições técnicas
- Plano de implementação / Fase 1 — Data foundation

## Technical Story

In order to create CRM records under a predictable local-first structure,
As the plugin foundation,
I want minimal settings and folder creation helpers,
So that future entity commands can write Markdown files into the configured CRM root.

## Outcome

The plugin has minimal settings matching the MVP and can ensure the base folder structure exists:

```text
CRM/
  People/
  Companies/
  Opportunities/
  Interactions/
```

## Acceptance Behavior

```text
Given the plugin is enabled with default settings
When the CRM folder foundation is initialized
Then the configured CRM root and base subfolders exist in the vault
```

```text
Given the MVP forbids network, telemetry, IA, backend, and desktop-only dependencies
When the settings/folder foundation is inspected
Then no forbidden behavior has been introduced
```

## Scope

- Add settings model with MVP defaults.
- Add settings tab only if needed for changing `crmRoot` in this story.
- Add folder/path constants or helpers.
- Add helper to ensure the CRM root and base folders exist.
- Use Obsidian vault APIs, not Node filesystem APIs.

## Out Of Scope

- Creating person/company/opportunity files.
- Logging interactions.
- Generating follow-up tasks.
- Real dashboard behavior.
- Pipeline behavior.
- IA, network, telemetry, backend, login, sync, or external integrations.

## Validation

- Build passes.
- Manual test in the test vault confirms folders can be created under default `CRM/`.
- Source/config scan confirms no forbidden behavior was introduced.
