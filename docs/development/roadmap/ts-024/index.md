[< Parent](../index.md)

# TS-024 — Opportunity Name Follows the File Name

**Status:** 🟩 Done
**Type:** Technical Story

---

## Outcome

Renaming an opportunity note in Obsidian left its pipeline card unchanged: the card title comes from the frontmatter `name`, and the file name (`Company - Name`) was a second, unsynced source of the same title.

- The file name is the source of truth for the title. On every vault rename, an opportunity inside the CRM folder gets `name` set to the file name without the `Company - ` prefix (the whole file name when the prefix is missing).
- Renames made by **Edit opportunity** already match and leave `name` as typed, including characters that file names cannot hold.
- `crm_id` does not change, so the card keeps its place in the board order.
- The card description stays in `notes`; the form now says it is shown on the card. Body sections such as `## Situation` are not shown on the card, by decision.

## Tests

85 tests. Renaming with and without the company prefix, a rename made by editing, and renames of company notes and of notes outside the CRM folder.
