[< Roadmap](../index.md)

# DS-001 — Bootstrap Obsidian Plugin Foundation

**Status:** 🟩 Done

---

## MVP Source

Derived from these sections of the private MVP contract (`MVP.md`):

- Technical architecture
- Obsidian APIs to use
- Technical constraints
- Initial manifest
- Technical acceptance criteria CA1, CA2, CA3, CA9, CA10
- Implementation plan / Phase 0 — Bootstrap

Source file:

`MVP.md` (private product contract, outside this repository)

## Outcome

A minimal Obsidian plugin project exists in this repository, based on the official sample plugin pattern, with a valid manifest, build pipeline, README skeleton, and a no-op CRM dashboard command that proves the plugin loads.

## Candidate Stories

| Code | Story | Type | Outcome | Status |
|------|-------|------|---------|--------|
| TS-001 | Create loadable plugin scaffold | Technical Story | Project structure, manifest, package config, and build pipeline exist. | 🟩 Done |
| — | Register minimal dashboard command | Technical Story | Obsidian command palette exposes an “Open CRM dashboard” command with no CRM behavior yet. | 🟩 Absorbed into TS-001 |
| — | Document MVP constraints in repo | Technical Story | README documents local-first, no network, no telemetry, no AI, and MVP source of truth. | 🟩 Absorbed into TS-001 |

## Done Condition

DS-001 is done when the plugin can be manually installed in an Obsidian vault by copying `main.js`, `manifest.json`, and `styles.css`, the plugin loads without error, and the command palette shows the placeholder CRM dashboard command.

Done evidence:

- `npm install` passed.
- `npm run build` passed.
- `npm audit --audit-level=moderate` passed with zero vulnerabilities.
- `main.js`, `manifest.json`, and `styles.css` were copied to the test vault.
- Navigator confirmed the plugin enabled successfully and the placeholder command showed the expected message.

No CRM entity creation, interaction logging, dashboard behavior, pipeline behavior, IA, network, telemetry, or backend work belongs in DS-001.
