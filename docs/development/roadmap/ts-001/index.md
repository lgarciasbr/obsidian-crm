[< Parent](../index.md)

# TS-001 — Create Loadable Plugin Scaffold

**Status:** 🟩 Done
**Type:** Technical Story

---

## MVP Source

Derived from these sections of the private MVP contract (`MVP.md`):

- Technical architecture
- Initial manifest
- Technical constraints
- Technical acceptance criteria CA1, CA2, CA3, CA9, CA10
- Implementation plan / Phase 0 — Bootstrap

Source file:

`MVP.md` (private product contract, outside this repository)

## Outcome

A minimal Obsidian plugin scaffold exists for Relationship CRM and can be built into the files required for manual plugin installation.

## Story Statement

In order to start the Relationship CRM plugin safely,
As the plugin codebase,
I want a loadable Obsidian plugin scaffold,
So that future MVP behavior can be added incrementally under the no-network, no-telemetry, no-IA constraints.

## Acceptance Behavior

```text
Given the Obsidian-CRM repository exists
When dependencies are installed and the build command runs
Then `main.js` is generated without build errors
And `manifest.json` and `styles.css` are present
```

```text
Given the generated plugin files are copied into a test vault plugin folder
When the plugin is enabled in Obsidian
Then it loads without runtime errors
```

## Scope

- Create minimal Obsidian plugin scaffold.
- Add MVP-aligned `manifest.json`.
- Add build configuration.
- Add README skeleton documenting the MVP constraints.
- Generate `main.js` through the build.

## Out Of Scope

- CRM commands.
- Entity creation.
- Interaction logging.
- Real dashboard behavior.
- Opportunity pipeline behavior.
- IA, network, telemetry, backend, login, or sync.

## Validation

- Run `npm install`.
- Run `npm run build`.
- Verify `main.js`, `manifest.json`, and `styles.css` exist.
- Inspect source for forbidden scaffold behavior.
- Optionally perform manual Obsidian enablement in a test vault.

---

## Artifacts

- [Plan](plan.md)
- [Test Guide](test-guide.md)
