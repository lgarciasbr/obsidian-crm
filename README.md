# CRM for Obsidian

A local-first CRM for solo professionals to manage relationships, opportunities, and follow-ups inside Obsidian. The plugin id is `crm` and it is shown in Obsidian as **CRM**.

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

## Tests

```bash
npm test
```
