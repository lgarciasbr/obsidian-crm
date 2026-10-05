[< Roadmap](../index.md)

# DS-004 — Value Surfaces

**Status:** 🟩 Done

---

## MVP Source

Derived from `MVP.md` sections:

- Views / Attention Dashboard
- Views / Opportunity Pipeline
- Comandos / Open attention dashboard
- Comandos / Open opportunity pipeline
- Critérios de aceite técnicos CA8
- Critérios de aceite de produto PA3

## Outcome

The plugin exposes MVP value surfaces that turn CRM records and follow-up metadata into actionable visual views.

## Candidate Stories

| Code | Story | Type | Outcome | Status |
|------|-------|------|---------|--------|
| TS-010 | Build Attention Dashboard | Technical Story | User can open a dashboard showing overdue, today, next 7 days, no next action, and cooling relationships. | 🟩 Done |
| TS-011 | Build simple Opportunity Pipeline | Technical Story | User can view open opportunities grouped by stage. | 🟩 Done |
| TS-012 | Polish CRM Creation Modals | Technical Story | Creation and interaction modals feel like polished Obsidian quick-capture flows. | 🟩 Done |
| TS-013 | Kanban-style pipeline editing | Technical Story | Stages live in `Pipeline.md`; cards and columns support drag-and-drop; stages can be created, renamed and deleted. | 🟩 Done |
| TS-014 | Remove dashboard and implement Set next action | Technical Story | Rejected Attention Dashboard is removed; `Set next action` updates the active CRM note. | 🟩 Done |
| TS-015 | Pipeline creation flow and formatting defaults | Technical Story | Board stays open after creation, BRL formats as pt-BR, empty relationship fields show no fake suggestions. | 🟩 Done |
| TS-017 | CRM Home with tabs | Technical Story | Single CRM view with Pipeline, Empresas and Contatos tabs. | 🟩 Done |

## Navigator Revision

After TS-012 the Navigator rejected the Attention Dashboard as low-value. TS-013 and TS-015 deepened the pipeline as the primary surface, and TS-014 removes the dashboard. TS-017 then unified the surfaces into a tabbed CRM Home. DS-004 was closed on 2026-10-05 as part of the v0.1 baseline.

## Done Condition

DS-004 is done when the user can open the Attention Dashboard and simple Opportunity Pipeline from CRM data created by previous stories.

Done evidence:

- TS-010 implemented the MVP Attention Dashboard and was accepted as sufficient for MVP after UX revision.
- TS-011 implemented a file-backed Opportunity Pipeline using `CRM/Pipeline.md`, grouped opportunities by stage, and supported core card actions.
- TS-012 polished creation/capture modals used by the CRM value surfaces and fixed the modal horizontal-scroll regression.
- Technical validation passed for the implemented slices: build, forbidden-behavior scan, and deployment to the test vault.

Deferred debt:

- TD-001: pipeline next action is read from opportunity frontmatter, not derived by scanning multiple interactions/tasks.
- Pipeline file opening uses a lightweight conversion from Markdown to visual view; deeper Kanban-style internals can be revisited later.

No IA, network, telemetry, backend, login, sync, external integrations, analytics, financial reporting, or advanced CRM forecasting belong in DS-004.
