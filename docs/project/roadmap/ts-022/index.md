[< Parent](../index.md)

# TS-022 — Agent Guide in the CRM Folder

**Status:** 🟩 Done
**Type:** Technical Story

---

## Outcome

- The CRM root gets `AGENTS.md`, a guide that lets an AI agent create and update companies, people, opportunities and interactions by editing Markdown directly, plus `CLAUDE.md` (`@AGENTS.md`) for Claude Code. Dotfiles were rejected because Obsidian hides them.
- The plugin creates both files when missing and never overwrites them on its own. **CRM: Update agent guide** regenerates `AGENTS.md`, keeping the user's text under "Your notes".
- The guide is generated from the user's `Pipeline.md` stages, the interaction kinds, the CRM folder and the follow-up task settings. Its example notes come from `src/crm/templates.ts`, the same templates the plugin uses to create notes.
- Remaining `vault.modify` calls replaced by `vault.process`; an empty frontmatter list is written as `[]`.

## Tests

62 tests. The guide's example notes are validated against the data contract, every "see ..." reference must point to an existing section, regeneration keeps user notes and is idempotent, and initialization never overwrites an existing guide.
