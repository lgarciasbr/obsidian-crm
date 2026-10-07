import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addStage,
  formatDate,
  formatMoney,
  frontmatterList,
  moveStage,
  neighbourTarget,
  normalizeStage,
  parseMoney,
  pruneCardOrder,
  removeStage,
  reorderCard,
  sortCards,
  renameStage,
} from "../src/crm/pipeline";
import { validateFrontmatter } from "../src/crm/integrity";

const stages = ["lead", "conversation", "proposal"];

test("normalizeStage lowercases, trims and defaults to lead", () => {
  assert.equal(normalizeStage("  Qualified "), "qualified");
  assert.equal(normalizeStage(""), "lead");
});

test("addStage appends a new stage and rejects duplicates ignoring case", () => {
  assert.deepEqual(addStage(stages, " Qualified "), { stages: [...stages, "Qualified"] });
  assert.deepEqual(addStage(stages, "LEAD"), { error: "exists" });
  assert.deepEqual(addStage(stages, "  "), { error: "empty" });
});

test("renameStage keeps the label as typed and reports the stored value to move", () => {
  assert.deepEqual(renameStage(stages, "conversation", "Qualified"), {
    stages: ["lead", "Qualified", "proposal"],
    from: "conversation",
    to: "qualified",
  });
  assert.deepEqual(renameStage(stages, "conversation", "Lead"), { error: "exists" });
  assert.deepEqual(renameStage(stages, "conversation", "CONVERSATION"), { error: "unchanged" });
});

test("removeStage only removes the given stage", () => {
  assert.deepEqual(removeStage(stages, "conversation"), ["lead", "proposal"]);
});

test("moveStage reorders columns and ignores unknown stages", () => {
  assert.deepEqual(moveStage(stages, "proposal", "lead"), ["proposal", "lead", "conversation"]);
  assert.deepEqual(moveStage(stages, "lead", "proposal"), ["conversation", "proposal", "lead"]);
  assert.deepEqual(moveStage(stages, "nope", "lead"), stages);
});

test("stages with capital letters are valid for the validator", () => {
  const violations = validateFrontmatter(
    "crm/opportunity",
    { type: "crm/opportunity", crm_id: "o-1", name: "Deal", stage: "qualified" },
    { stages: ["Lead", "Qualified"] }
  );
  assert.deepEqual(violations, []);
});

test("parseMoney understands both decimal conventions", () => {
  assert.equal(parseMoney("15000"), 15000);
  assert.equal(parseMoney("15.000"), 15000);
  assert.equal(parseMoney("15.000,50"), 15000.5);
  assert.equal(parseMoney("1000.50"), 1000.5);
  assert.equal(parseMoney("1,500.75"), 1500.75);
  assert.equal(parseMoney("1,5"), 1.5);
  assert.equal(parseMoney("R$ 2.500"), 2500);
  assert.equal(parseMoney(""), null);
  assert.equal(parseMoney("abc"), null);
});

test("formatMoney formats in the configured currency and locale", () => {
  assert.equal(formatMoney("1000.50", "USD", "en-US"), "$1,000.50");
  assert.equal(formatMoney("abc", "USD", "en-US"), "abc");
  assert.equal(formatMoney("", "USD", "en-US"), "");
});

test("formatDate localizes ISO dates and leaves anything else alone", () => {
  assert.equal(formatDate("2026-10-05", "en-US"), "10/5/2026");
  assert.equal(formatDate("soon", "en-US"), "soon");
});

test("frontmatterList reads a YAML list straight from file content", () => {
  const content = '---\ntype: crm/pipeline\nstages:\n  - lead\n  - "Qualified"\ncollapsed:\n  - lead\n---\n\n# Pipeline\n';
  assert.deepEqual(frontmatterList(content, "stages"), ["lead", "Qualified"]);
  assert.deepEqual(frontmatterList(content, "collapsed"), ["lead"]);
  assert.equal(frontmatterList(content, "missing"), null);
});

const card = (id: string, name: string) => ({ id, name });

test("sortCards follows the saved order and puts unknown cards last, alphabetically", () => {
  const cards = [card("c", "Charlie"), card("a", "Alpha"), card("x", "Zulu"), card("b", "Bravo"), card("y", "Yankee")];
  assert.deepEqual(sortCards(cards, ["b", "gone", "c", "a"]).map((c) => c.id), ["b", "c", "a", "y", "x"]);
  assert.deepEqual(sortCards(cards, []).map((c) => c.id), ["a", "b", "c", "y", "x"]);
});

test("reorderCard places a card before another card in its column", () => {
  assert.deepEqual(reorderCard(["a", "b", "c"], ["a", "b"], "c", "a"), ["c", "a", "b"]);
  assert.deepEqual(reorderCard(["a", "b", "c"], ["b", "c"], "a", "c"), ["b", "a", "c"]);
});

test("reorderCard without a target card puts the card at the end of the column", () => {
  // Column shows a, b; another column holds z, which sits later in the global order.
  assert.deepEqual(reorderCard(["a", "b", "z"], ["a", "b"], "z", null), ["a", "b", "z"]);
  assert.deepEqual(reorderCard(["z", "a", "b"], ["a", "b"], "z", null), ["a", "b", "z"]);
  assert.deepEqual(reorderCard([], [], "a", null), ["a"]);
});

test("reorderCard keeps the visible order of cards that were not in the saved order yet", () => {
  // The column shows a (saved) then n1, n2 (never ordered, shown alphabetically at the end).
  assert.deepEqual(reorderCard(["a"], ["a", "n1", "n2"], "n2", "a"), ["n2", "a", "n1"]);
});

test("pruneCardOrder drops ids of opportunities that no longer exist", () => {
  assert.deepEqual(pruneCardOrder(["a", "gone", "b", "a"], ["a", "b"]), ["a", "b"]);
});

test("moving a card up or down targets the right neighbour", () => {
  const column = ["a", "b", "c"];
  assert.equal(neighbourTarget(column, "b", "up"), "a");
  assert.equal(neighbourTarget(column, "c", "up"), "b");
  assert.equal(neighbourTarget(column, "a", "up"), undefined, "already first");
  assert.equal(neighbourTarget(column, "a", "down"), "c", "goes before the card after its neighbour");
  assert.equal(neighbourTarget(column, "b", "down"), null, "becomes last");
  assert.equal(neighbourTarget(column, "c", "down"), undefined, "already last");
  // Applied with reorderCard, the result is the expected swap.
  assert.deepEqual(reorderCard(column, column, "a", neighbourTarget(column, "a", "down")!), ["b", "a", "c"]);
  assert.deepEqual(reorderCard(column, column, "b", neighbourTarget(column, "b", "down")!), ["a", "c", "b"]);
});
