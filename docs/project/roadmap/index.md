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
| DS-002 | Data foundation for CRM entities | The plugin can create and read people, companies, and opportunities as Markdown/frontmatter records. | 🟡 Planned |
| DS-003 | Interaction loop and follow-up | The plugin can log interactions, update related records when possible, and create Markdown follow-up tasks. | 🟩 Done |
| DS-004 | Value surfaces | The plugin exposes the Attention Dashboard and simple Opportunity Pipeline from MVP data. | 🟩 Done |
| DS-005 | Community-ready hardening | The plugin is documented, privacy-safe, manually installable, tested where practical, and ready for release review. | ⚪ Backlog |

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
