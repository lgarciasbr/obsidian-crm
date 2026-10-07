# Development history

This folder is the design and delivery record of the plugin. You do not need it to use the plugin or to contribute; start with the [README](../../README.md), [CONTRIBUTING](../../CONTRIBUTING.md) and the [data contract](../data-contract.md).

- [`roadmap/index.md`](roadmap/index.md) — delivery stories (DS-…) and technical stories (TS-…), with their status.
- `roadmap/ts-0NN/` — one folder per story: plan, test guide, validation, review and done notes, written while the story was built.
- `roadmap/technical-debt-ledger.md` — debt accepted on purpose, with the reason and when to revisit it.
- `roadmap/templates/` — templates for new stories (their relative links only resolve once copied into a story folder).

Notes for readers:

- The project follows a lightweight method in which a **Navigator** (the maintainer) chooses and validates the work and an AI pair implements it; "Navigator validated" means the maintainer checked it by hand in Obsidian.
- The product scope comes from a private MVP contract (`MVP.md`) that is not part of this repository; stories cite its sections by name.
- The interface was in Portuguese until TS-018. Stories written before that quote the Portuguese UI text of the time (for example `## Histórico` or *Próxima ação*); it is kept as written because it describes how the plugin behaved then.
