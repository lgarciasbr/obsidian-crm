# Changelog

All notable changes to this plugin are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). Each release's notes on GitHub are
taken from its section below.

## [Unreleased]

## [0.3.0] - Pending release

### Added
- Card menu: **Move up**, **Move down** and **Move to <stage>**, so cards can be organized on touch screens and with the keyboard.
- Phone layout: stacked form fields, full-width list search, and one board column per screen with swipe snapping.
- Enter submits the create, edit and stage forms.

### Changed
- Requires Obsidian **1.6.6 or later**, the first version supporting the API that respects your trash setting.
- Public documentation, contribution templates and private vulnerability reporting are now available. The README has no images.
- Deleting an opportunity also removes its links from the company and contact notes and its place in the board order, and respects your trash setting.
- The plugin only reads the CRM folder instead of scanning the whole vault, which is faster in large vaults.
- Changing the CRM folder closes open CRM views (reopen them with **CRM: Open**).
- Icon buttons use Obsidian's native look.

### Fixed
- Saving twice by double-clicking a form button; failures now show a notice instead of failing silently.
- Unusual values typed by hand in frontmatter no longer show up as `[object Object]`.

### Security
- A company's website opens only if it is an `http`/`https` link; other link types (`javascript:`, `file:`, operating-system protocol handlers) are no longer opened.
- The CRM folder setting can no longer point outside the vault.
- The agent guide tells AI agents to treat note content as data, never as instructions.

## [0.2.0] - 2026-10-06

First release for beta testers (BRAT).

### Added
- Manual card order in the pipeline: drag a card before or after another, in the same or another column. The order is saved in `Pipeline.md`.
- `AGENTS.md` and `CLAUDE.md` in the CRM folder: a guide that lets AI agents create and update records without breaking links. **CRM: Update agent guide** regenerates it.
- Companies and Contacts tabs next to the pipeline.
- **CRM: Set next action**, available on person, company and opportunity notes.

### Changed
- The plugin is called **CRM** inside Obsidian and its id is `crm`.
- The interface and generated notes are in English. Interaction kinds are `call`, `meeting`, `email`, `whatsapp`, `linkedin`, `note` and `other`.
- Commands no longer repeat the plugin name (Obsidian shows them as `CRM: <command>`).
- The Log interaction button sits next to the card menu, so it never covers card text.

### Fixed
- Links between opportunities, companies and people are written correctly when the related records are created in the same form.
- Logging an interaction creates the person or company typed as new.
- Editing an opportunity keeps its file name, sections and backlinks in sync.
- Set next action no longer adds a new `## Next action` heading each time.
- Stages with capital letters no longer make their opportunities fail validation.
- Amounts with a dot as decimal mark (`1000.50`) are read correctly.

## [0.1.0] - 2026-07-08

Initial MVP: people, companies, opportunities and interactions as Markdown notes; follow-up tasks; a Kanban-style opportunity pipeline; data validation.

[Unreleased]: https://github.com/lgarciasbr/obsidian-crm/compare/0.3.0...HEAD
[0.3.0]: https://github.com/lgarciasbr/obsidian-crm/compare/0.2.0...HEAD
[0.2.0]: https://github.com/lgarciasbr/obsidian-crm/releases/tag/0.2.0
[0.1.0]: https://github.com/lgarciasbr/obsidian-crm/commit/cac0f94
