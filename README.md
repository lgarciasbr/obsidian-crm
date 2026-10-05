# Relationship CRM

A local-first CRM for solo professionals to manage relationships, opportunities, and follow-ups inside Obsidian. Inside Obsidian the plugin is shown as **CRM**; the UI and generated notes are in English.

## MVP status

The v0.1 MVP loop is implemented: create people, companies and opportunities, log interactions, update follow-up metadata, generate Markdown tasks, and manage opportunities on a Kanban-style pipeline. Community-ready hardening (DS-005) has not started. See [the roadmap](docs/project/roadmap/index.md).

The MVP source of truth is `MVP.md`, a private product contract kept outside this repository.

## v0.1 constraints

Relationship CRM v0.1 is intentionally constrained:

- local-first;
- no network calls;
- no telemetry or analytics;
- no AI features;
- no backend;
- no login;
- no sync service;
- Markdown/frontmatter will be the source of truth for CRM records.

## Planned MVP loop

```text
register interaction → update relationship → create next action → show it on the dashboard
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
<TestVault>/.obsidian/plugins/relationship-crm/
```

Then enable the plugin in Obsidian.

## Commands

- `Open CRM` — open the CRM view (Pipeline, Companies, Contacts)
- `Initialize CRM folders`
- `Create person`, `Create company`, `Create opportunity`
- `Log interaction`
- `Set next action` — on the active person, company or opportunity note
- `Validate CRM data`

## Tests

```bash
npm test
```
