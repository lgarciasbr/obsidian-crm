[< Roadmap](../index.md)

# DS-002 — Data Foundation for CRM Entities

**Status:** 🟩 Done

---

## MVP Source

Derived from `MVP.md` sections:

- Estrutura padrão no vault
- Entidades
- Comandos / Create person
- Comandos / Create company
- Comandos / Create opportunity
- APIs do Obsidian a usar
- Restrições técnicas
- Critérios de aceite técnicos CA4, CA5, CA6, CA10

Source file:

`MVP.md` (private product contract, outside this repository)

## Outcome

The plugin can create and read the three base CRM entity types — people, companies, and opportunities — as Markdown files with predictable frontmatter, without introducing network, telemetry, IA, backend, or non-MVP behavior.

## Candidate Stories

| Code | Story | Type | Outcome | Status |
|------|-------|------|---------|--------|
| TS-002 | Add settings and CRM folder foundation | Technical Story | Plugin has minimal settings and can ensure the configured CRM folder structure exists. | 🟩 Done |
| TS-003 | Create person/company/opportunity records | Technical Story | Commands create Markdown files with MVP frontmatter for base entities. | 🟩 Done |
| TS-004 | Modularize data foundation code | Technical Story | Existing entity creation behavior is preserved while mixed responsibilities are split out of `main.ts`. | 🟩 Done |
| TS-005 | Read CRM records from metadata cache | Technical Story | Repository can list CRM entities from Markdown/frontmatter using Obsidian metadata where possible. | 🟩 Done |
| TS-006 | Select or create related entities | Technical Story | Person/opportunity creation can select existing related entities or explicitly create missing ones. | 🟩 Done |

## Done Condition

DS-002 is done when a user can create people, companies, and opportunities in the configured CRM root, and the plugin can read those records back from Markdown/frontmatter for later stories.

No interaction logging, follow-up task generation, real dashboard, pipeline behavior, IA, network, telemetry, backend, import, or external integration belongs in DS-002.
