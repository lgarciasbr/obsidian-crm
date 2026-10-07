# Contributing

Thanks for your interest in improving CRM. Bug reports, ideas and pull requests are welcome. By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting bugs and ideas

Use the [issue templates](https://github.com/lgarciasbr/obsidian-crm/issues/new/choose). For a bug, include your Obsidian version, platform (Windows, macOS, Linux, iOS, Android) and plugin version, and the steps to reproduce it. **Remove personal data** (names, e-mails, phone numbers of real contacts) from screenshots and note excerpts. Security problems go through [SECURITY.md](SECURITY.md), not public issues.

## Development setup

Requirements: Node.js 22 or later.

```bash
npm ci          # install dependencies
npm run dev     # rebuild main.js on every change
npm run lint    # Obsidian's review rules (eslint-plugin-obsidianmd)
npm test        # unit and flow tests
npm run build   # type-check and production build
```

To try a change, copy `main.js`, `manifest.json` and `styles.css` into `<test vault>/.obsidian/plugins/crm/` and reload the plugin. Use a test vault with made-up data, never your real one.

## How the code is organised

- `src/crm/` — rules with no UI: note templates, the data contract (`integrity.ts`), pipeline ordering, relationship writes. Most of it is pure and unit-tested.
- `src/views/` — the CRM view: pipeline board, contact/company lists, modals.
- `src/ui/` — the shared form modal.
- `tests/` — Node tests. `tests/helpers/fake-obsidian.ts` is an in-memory Obsidian used to run the create/edit flows; its metadata cache does not see freshly created notes, like the real one.
- `docs/data-contract.md` — the rules every CRM note follows. Changes to note format start here.
- `docs/testing.md` — the manual test script run before each release.
- `docs/development/` — the roadmap and design history.

## Pull requests

- Write a test first for any behaviour change, and keep `npm run lint`, `npm test` and `npm run build` green; CI runs all three.
- Keep pull requests small and focused, and explain *why* in the description and commit messages.
- Add a line to the `Unreleased` section of [CHANGELOG.md](CHANGELOG.md) for anything users will notice.
- The plugin must stay local-first: no network requests, no telemetry, no hidden writes outside the CRM folder.

## Releasing (maintainer)

See [Releasing](README.md#releasing) in the README.
