import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRecords, renderReport, RecordInput } from "../src/crm/validator";

const clean: RecordInput = {
  type: "crm/person", name: "Maria", basename: "Maria", path: "CRM/People/Maria.md",
  frontmatter: { type: "crm/person", crm_id: "person-maria", name: "Maria", role: "CEO" },
};

test("clean vault reports no violations", () => {
  const report = validateRecords([clean]);
  assert.equal(report.total, 1);
  assert.equal(report.clean, 1);
  assert.equal(report.records.length, 0);
  assert.equal(report.duplicates.length, 0);
  assert.match(renderReport(report, "2026-07-07"), /No contract violations/);
});

test("dirty vault surfaces record violations and duplicates", () => {
  const dirty: RecordInput[] = [
    clean,
    { type: "crm/person", name: "Maria", basename: "Maria", path: "CRM/People/Maria 2.md",
      frontmatter: { type: "crm/person", crm_id: "person-maria-2", name: "Maria", last_contact: "yesterday" } },
    { type: "crm/opportunity", name: "Diag", basename: "Acme - Diag", path: "CRM/Opportunities/Acme - Diag.md",
      frontmatter: { type: "crm/opportunity", crm_id: "o-1", name: "Diag", stage: "meeting" } },
  ];
  const report = validateRecords(dirty);
  assert.equal(report.total, 3);
  // duplicate basename "Maria"
  assert.equal(report.duplicates.length, 1);
  // the bad date and the invalid stage each produce a record with violations
  assert.equal(report.records.length, 2);
  const md = renderReport(report, "2026-07-07");
  assert.match(md, /Duplicate basenames/);
  assert.match(md, /BAD_ENUM/);
});
