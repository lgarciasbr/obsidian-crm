# Obsidian CRM Roadmap

## Source of Truth

This roadmap derives from the MVP contract:

`MVP.md` (private product contract, outside this repository)

Rules:

- Read `MVP.md` before planning or implementation.
- Do not expand v0.1 beyond the MVP contract.
- New ideas become future Change Requests or explicit out-of-scope notes.
- v0.1 remains local-first, no network, no telemetry, no AI, no backend.
- Core loop: register interaction → update relationship → create next action → show it on the dashboard.

## Delivery Stories

| Code | Delivery Story | Outcome | Status |
|------|----------------|---------|--------|
| DS-001 | Bootstrap Obsidian plugin foundation | A loadable Obsidian plugin project exists in this repository, with manifest/build/docs aligned to MVP constraints. | 🟩 Done |
| DS-002 | Data foundation for CRM entities | The plugin can create and read people, companies, and opportunities as Markdown/frontmatter records. | 🟩 Done |
| DS-003 | Interaction loop and follow-up | The plugin can log interactions, update related records when possible, and create Markdown follow-up tasks. | 🟩 Done |
| DS-004 | Value surfaces | The plugin exposes the Opportunity Pipeline as the primary visual surface (Attention Dashboard was built, then rejected and removed). | 🟠 In validation (TS-014) |
| DS-005 | Community-ready hardening | The plugin is documented, privacy-safe, manually installable, tested where practical, and ready for release review. | ⚪ Backlog |

## Story Index

| Code | Story | Delivery Story | Status |
|------|-------|----------------|--------|
| TS-001 | Create loadable plugin scaffold | DS-001 | 🟩 Done |
| TS-002 | Add settings and CRM folder foundation | DS-002 | 🟩 Done |
| TS-003 | Create person/company/opportunity records | DS-002 | 🟩 Done |
| TS-004 | Modularize data foundation code | DS-002 | 🟩 Done |
| TS-005 | Read CRM records and resolve entity links | DS-002 | 🟩 Done |
| TS-006 | Select or create related entities | DS-002 | 🟩 Done |
| TS-007 | Create interaction notes | DS-003 | 🟩 Done |
| TS-008 | Update related entity follow-up metadata | DS-003 | 🟩 Done |
| TS-009 | Generate Markdown follow-up tasks | DS-003 | 🟩 Done |
| TS-010 | Build Attention Dashboard (later removed by TS-014) | DS-004 | 🟩 Done |
| TS-011 | Build simple Opportunity Pipeline | DS-004 | 🟩 Done |
| TS-012 | Polish CRM creation modals | DS-004 | 🟩 Done |
| TS-013 | Kanban-style pipeline editing | DS-004 | 🟩 Done |
| TS-014 | Remove dashboard and implement Set next action | DS-004 | 🟠 Implemented — awaiting Navigator validation |
| TS-015 | Pipeline creation flow and formatting defaults | DS-004 | 🟩 Done |
| TS-016 | Markdown body relationship sync | DS-003 | 🟩 Done |

## Untracked Work In Progress

- **CRM Home with tabs** (commit `8519727`): replaces the standalone pipeline view with a single `CrmView` that has Dashboard (placeholder), Empresas, Contatos and Pipeline tabs. No story covers it yet, and its Dashboard tab conflicts with TS-014's dashboard removal — the Navigator must decide whether it becomes a new story or is reverted.

## v0.1 Non-goals

- AI features.
- Network calls.
- Telemetry or analytics.
- Backend, login, or sync service.
- Email, WhatsApp, or calendar integrations.
- CSV import.
- Custom fields.
- Multiple pipelines.
- Financial reports or sales forecasting.
- Required drag-and-drop pipeline behavior.
