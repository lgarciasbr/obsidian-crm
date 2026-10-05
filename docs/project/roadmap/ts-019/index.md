[< Parent](../index.md)

# TS-019 — Clean Slate: Plugin Id `crm`, No Compatibility Layer

**Status:** 🟩 Done
**Type:** Technical Story

---

## Context

Nobody uses the plugin yet, so there is no installed base or existing data to protect. Compatibility code only added weight.

## Outcome

- Plugin id is `crm` (was `relationship-crm`); npm package is `obsidian-crm`; the view type is `crm-view`; CSS classes and drag-and-drop MIME types use the `crm` prefix; classes are `CrmPlugin`, `CrmSettings`, `CrmSettingTab`.
- Manifest description no longer contains the word "Obsidian" (community review rule).
- Removed the `DEPRECATED_FIELD` validator rule and the unused `TEMPERATURES`, `OPPORTUNITY_STATUS` and `ENTITY_STATUS` enums.
- Data contract: no legacy notes; `outcome` dropped from interactions; R3 covers only `stage` and `kind`; R7 states that the validator does not check backlinks yet; the obsolete "What surfaces may assume" section (Attention Dashboard) is gone.
- Fixed leftovers from TS-018: opportunity links were still written under a Portuguese `Oportunidades` section; `Segmento`/`Consultoria` and `Selecionar...` labels translated.

## Validation

`npm run build` and `npm test` (13 tests) pass. Test vault plugin folder moved to `.obsidian/plugins/crm`. Manual check in Obsidian pending.
