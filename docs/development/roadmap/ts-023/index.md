[< Parent](../index.md)

# TS-023 — Manual Card Order in the Pipeline

**Status:** 🟩 Done
**Type:** Technical Story

---

## Outcome

Cards can be reordered by drag and drop within a column (and placed at a position when moved to another column), expressing the user's personal priority. Before, cards were always alphabetical.

- The order is board state, stored in `Pipeline.md` as `card_order`: one list of opportunity `crm_id`s for the whole board. Reordering writes one file; renaming an opportunity does not lose its position.
- Dropping on the upper half of a card inserts before it, on the lower half after it, on empty column space at the end; a line shows the drop position.
- Cards missing from `card_order` (new, or created outside the board) appear last in their column, alphabetically. Ids of deleted opportunities are pruned on save.
- Data contract documents `Pipeline.md`; the agent guide tells agents not to touch `card_order`.

## Tests

67 tests. Ordering, insertion and pruning are pure functions in `src/crm/pipeline.ts`. The drag-and-drop wiring in the view was validated manually in Obsidian by the Navigator on 2026-10-06.
