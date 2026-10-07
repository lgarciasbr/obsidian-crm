[< Parent](../index.md)

# TS-002 — Add Settings and CRM Folder Foundation

**Status:** 🟩 Done
**Type:** Technical Story

---

## MVP Source

Derived from these sections of the private MVP contract (`MVP.md`):

- Default vault structure
- Initial setup
- Obsidian APIs to use
- Technical constraints
- Implementation plan / Phase 1 — Data foundation

Source file:

`MVP.md` (private product contract, outside this repository)

## Outcome

The plugin has minimal MVP settings and can create the configured CRM folder structure in the vault.

## Story Statement

In order to create CRM records under a predictable local-first structure,
As the plugin foundation,
I want minimal settings and folder creation helpers,
So that future entity commands can write Markdown files into the configured CRM root.

## Acceptance Behavior

```text
Given the plugin is enabled with default settings
When the folder foundation is initialized
Then the configured CRM root and base subfolders exist in the vault
```

```text
Given a user changes `crmRoot` in plugin settings
When the folder foundation is initialized
Then the base CRM folders are created under the configured root
```

## Scope

- Add settings model with MVP defaults.
- Add `loadSettings` / `saveSettings` behavior.
- Add minimal settings tab if useful for changing `crmRoot`.
- Add folder/path constants or helpers.
- Add idempotent helper to ensure the CRM root and base folders exist.
- Use Obsidian vault APIs, not Node filesystem APIs.

## Out Of Scope

- Creating person/company/opportunity files.
- Entity modals.
- Interaction logging.
- Follow-up task generation.
- Real dashboard behavior.
- Pipeline behavior.
- IA, network, telemetry, backend, login, sync, or external integrations.

## Validation

- Run `npm run build`.
- Deploy to test vault.
- Initialize folders.
- Confirm `CRM/People`, `CRM/Companies`, `CRM/Opportunities`, and `CRM/Interactions` exist.
- Inspect source/config for forbidden behavior.

---

## Artifacts

- [Plan](plan.md)
- [Test Guide](test-guide.md)
