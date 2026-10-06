# CRM for Obsidian

A local-first CRM for solo professionals to manage relationships, opportunities, and follow-ups inside Obsidian. The plugin id is `crm` and it is shown in Obsidian as **CRM**.

## Install (beta)

The plugin is not in the community directory yet. Install it with [BRAT](https://github.com/TfTHacker/obsidian42-brat), which also keeps it updated:

1. In Obsidian, install and enable **BRAT** from Community plugins.
2. Run **BRAT: Add a beta plugin for testing** and enter `lgarciasbr/obsidian-crm`.
3. Enable **CRM** in Community plugins.
4. Before using any command, choose the CRM folder in **Settings → CRM → Root folder** (default `CRM`).

Manual alternative: download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/lgarciasbr/obsidian-crm/releases/latest) into `<vault>/.obsidian/plugins/crm/`.

**Mobile:** the plugin loads on mobile, but dragging cards and columns relies on HTML drag and drop, which may not work on touch screens. Use **Edit** on a card to change its stage.

## MVP status

The v0.1 MVP loop is implemented: create people, companies and opportunities, log interactions, update follow-up metadata, generate Markdown tasks, and manage opportunities on a Kanban-style pipeline. Community-ready hardening (DS-005) has not started. See [the roadmap](docs/project/roadmap/index.md).

The MVP source of truth is `MVP.md`, a private product contract kept outside this repository.

## v0.1 constraints

CRM v0.1 is intentionally constrained:

- local-first;
- no network calls;
- no telemetry or analytics;
- no AI features;
- no backend;
- no login;
- no sync service;
- Markdown/frontmatter is the source of truth for CRM records (see the [data contract](docs/project/data-contract.md)).

## Core loop

```text
log interaction → update relationship → set next action → see it on the pipeline
```

## Development

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Manual installation files:

```text
main.js
manifest.json
styles.css
```

Copy those files into a test vault:

```text
<TestVault>/.obsidian/plugins/crm/
```

Then enable the plugin in Obsidian.

## Commands

Obsidian lists them as `CRM: <command>`:

- `Open` — open the CRM view (Pipeline, Companies, Contacts); also on the ribbon
- `Initialize folders`
- `Create person`, `Create company`, `Create opportunity`
- `Log interaction`
- `Set next action` — only available on a person, company or opportunity note
- `Validate data` — writes `Validation Report.md` in the CRM folder
- `Update agent guide` — regenerates `AGENTS.md` in the CRM folder

## Working with AI agents

The CRM folder contains an `AGENTS.md` guide (and a `CLAUDE.md` that points to it) so an AI agent can create and update companies, people, opportunities and interactions by editing the Markdown directly without breaking links or the [data contract](docs/project/data-contract.md). The plugin creates both files when they are missing and never overwrites them on its own; run `Update agent guide` after changing pipeline stages or settings. Text you add under **Your notes** at the end of `AGENTS.md` is kept when it is regenerated.

The guide's example notes are produced by the same templates the plugin uses, and the test suite validates them against the data contract, so the guide stays in step with the code.

## Releasing

1. Bump `version` in `manifest.json` and `package.json`, and add the version to `versions.json` (`npm test` checks they agree).
2. Commit and push, and wait for CI.
3. Push a tag equal to the version, without `v`: `git tag 0.2.0 && git push origin 0.2.0`.

The Release workflow builds, tests, checks the tag against the manifest and publishes the release with `main.js`, `manifest.json` and `styles.css`. BRAT users get it on their next update check.

## Tests

```bash
npm test
```
