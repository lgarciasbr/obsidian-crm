[< Parent](../index.md)

# TS-017 — CRM Home with Tabs

**Status:** 🟩 Done
**Type:** Technical Story

---

## Outcome

The standalone opportunity pipeline view is replaced by a single `CrmView` ("CRM Home", command `Open Relationship CRM`) with tabs:

- **Pipeline** — the Kanban board from TS-011/TS-013/TS-015 (default tab).
- **Empresas** and **Contatos** — lists of company and person records.

## Origin

Implemented without a planned story and committed as `8519727`. Closed by Navigator decision on 2026-10-05 as part of the v0.1 baseline. Manual Obsidian validation was not performed; the build in the test vault matches this code.

## Follow-up (2026-10-05)

The original commit also had an empty Dashboard placeholder tab. The Navigator decided not to work on a dashboard now, so the tab was removed and the order became Pipeline → Empresas → Contatos.
