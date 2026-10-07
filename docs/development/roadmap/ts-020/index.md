[< Parent](../index.md)

# TS-020 — Reliable Relationship References

**Status:** 🟩 Done
**Type:** Technical Story

---

## Problem

Creating an opportunity with a company and a contact in a fresh vault left broken references:

- the opportunity body showed `Test Company` / `Tester` as plain text instead of wikilinks;
- the new person had an empty `company` and the company's `## People` stayed empty;
- links were inserted glued to the next heading (`- [[x]]` directly followed by `## History`).

Root cause: related records were looked up through Obsidian's metadata cache, which has not indexed a note created a moment earlier, so lookups silently fell back to plain text or skipped backlinks. Two more flows ignored the "create new" fields entirely: logging an interaction (the typed person/company was never created or linked) and editing an opportunity (choosing a new company cleared the field).

## Outcome

- One resolve-or-create rule (`EntityCreator.resolveCompany` / `resolvePerson`) used by New person, New opportunity, Edit opportunity and Log interaction. It links to the file actually created, so a taken name (`Acme 2`) is linked correctly.
- A contact created with a company, or an existing contact without one, gets `company` set and is listed under the company's `## People`. A contact who already belongs to another company is not moved.
- Editing an opportunity keeps frontmatter, file name, H1, `## Company` / `## Contact` sections and backlinks in sync, removing the backlink from the previous company/contact.
- Section edits always produce `heading, blank line, content, blank line, next heading`; empty frontmatter values have no trailing space.
- The Log interaction form no longer offers "Create opportunity" (an opportunity needs a company and a stage that form does not ask for).

## Validation

`npm test`: 29 tests, including Node integration tests of the four flows against an in-memory Obsidian whose metadata cache does not see freshly created notes. Manual check in Obsidian pending.
