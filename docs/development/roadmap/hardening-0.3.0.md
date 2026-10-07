# Audit remediation — 0.3.0 candidate

## Scope and completed implementation

1. **Security** (`0150ef4`): HTTP(S)-only external URLs; normalized root folder with traversal rejection; note-content-as-data rule in the generated agent guide.
2. **Integrity and robustness** (`56ae7c8`): opportunity deletion removes backlinks and board order, then uses Obsidian's trash preference; guarded forms, Enter submission and failure notices; repository traversal scoped to the CRM root; root changes close open CRM views.
3. **Code quality** (`0527555`, `c3303cf`): strict TypeScript, shared defensive value/link helpers, Obsidian ESLint rules in CI, unused code/CSS removed, view split into shell, board, lists, modals and shared record helpers.
4. **Mobile** (`3f62e80`): card-menu ordering and stage movement; phone-specific form, search and board CSS. Actual mobile behavior remains a manual validation gate.
5. **CI and dependencies** (`b405a76`): read-only CI permissions, weekly Dependabot, changelog-derived release notes and release metadata tests. Dependabot PRs require individual review; successful checks do not imply automatic merge.
6. **Open source documentation** (`ae15133`): user-focused README without images or replacement screenshots; changelog; SECURITY, CONTRIBUTING, Contributor Covenant; issue/PR templates; package metadata and author URL; internal docs moved to docs/development with context; data contract kept public; desktop/mobile manual test script. GitHub private vulnerability reporting enabled and verified.

## Release authorization

On 2026-10-07 the Navigator explicitly authorized publishing 0.3.0 for BRAT. The candidate had been installed in both local vaults with backups. No completed desktop/mobile manual checklist was reported in the conversation; authorization to release is not evidence that those checks passed. Windows/mobile beta feedback remains outstanding.

## Release gate (phase 7)

- Candidate version: **0.3.0**; minimum Obsidian version: **1.6.6**, required by FileManager.trashFile.
- Run lint, tests, production build and GitHub Actions for the exact candidate commit.
- Install only with explicit operational approval, backing up the prior plugin files. Do not migrate CRM records as part of installation.
- Navigator runs [the manual test script](../../testing.md), including icon styling, long titles, ordering, forms, deletion and phone layout. Do not claim those tests have passed based on unit tests.
- Finalize the changelog date and publish the version tag only after approval; then verify release assets and beta tester feedback on Windows/mobile.

## Privacy and explicit exclusions

- No screenshots for now, and no replacement illustrations or sample gallery in the README. This is the Navigator's explicit choice, not unfinished implementation.
- Never publish real contacts, exports, vault paths or screenshots containing personal data. An existing test vault may contain real imported records; do not assume its contents are fictional or delete/migrate them without permission.
- Community directory submission waits for actual usage feedback; no submission is included in this release.
- Major-version Action pins plus Dependabot are accepted for now instead of SHA pins.
- Real Obsidian UI automation is not included; use the manual desktop/mobile checklist.
- Multi-note writes are not transactional; retain vault backups. No rollback guarantee is claimed.
- Dependency audit: zero production dependency findings. Three moderate development-package findings trace to the same Moment advisory (GHSA-4p3w-j4w9-5jqw), through Obsidian and the lint plugin. Obsidian is externalized from the plugin bundle; do not use `npm audit fix --force`, which recommends incompatible downgrades. Recheck when upstream packages update.
