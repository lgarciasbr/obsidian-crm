# Relationship CRM

A local-first CRM for solo professionals to manage relationships, opportunities, and follow-ups inside Obsidian.

## MVP status

This repository is currently in the TS-001 bootstrap stage. The plugin scaffold can load in Obsidian, but real CRM behavior is not implemented yet.

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

## Current behavior

The plugin registers a placeholder command:

```text
Open CRM dashboard
```

The command only shows a notice. Real dashboard behavior belongs to a later story.
