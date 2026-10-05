[< Parent](../index.md)

# TS-018 — English UI and "CRM" Display Name

**Status:** 🟩 Done
**Type:** Technical Story

---

## Outcome

- Inside Obsidian the plugin is shown as **CRM** (manifest name, view title, settings heading, `Open CRM` command and ribbon). (The plugin id was later changed to `crm` in TS-019.)
- All UI text (commands, modals, notices, CRM view), generated note sections and code comments are in English.
- Interaction `kind` values are now `call`, `meeting`, `email`, `whatsapp`, `linkedin`, `note`, `other`.
- Number/currency formatting is unchanged (settings default `BRL` / `pt-BR`).

## Data Migration

The test vault was migrated (backup zip taken first): pt-BR section headings renamed to English, interaction kinds converted, and one interaction file renamed from `ligação` to `call` with its wikilinks updated. User-written content was not translated.

## Validation

`npm run build` and `npm test` (14 tests) pass. Manual check in Obsidian pending.
