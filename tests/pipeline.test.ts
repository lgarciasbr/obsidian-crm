import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addStage,
  formatDate,
  formatMoney,
  frontmatterList,
  moveStage,
  normalizeStage,
  parseMoney,
  removeStage,
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
