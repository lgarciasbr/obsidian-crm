import { parseFrontmatter } from "./helpers/fake-obsidian";
import { test } from "node:test";
import assert from "node:assert/strict";
import { companyNote, interactionNote, interactionTitle, opportunityNote, opportunityTitle, personNote } from "../src/crm/templates";
import { validateFrontmatter } from "../src/crm/integrity";
import { frontmatter } from "../src/crm/frontmatter";

function assertValid(content: string): void {
  const fm = parseFrontmatter(content);
  assert.deepEqual(validateFrontmatter(String(fm.type), fm), []);
}

test("company note has the contract frontmatter and body sections", () => {
  const note = companyNote({ name: "Acme", site: "https://acme.example" });
  assertValid(note);
  assert.equal(parseFrontmatter(note).crm_id, "company-acme");
  assert.match(note, /\n# Acme\n\n## Context\n\n## People\n\n## Opportunities\n\n## History\n$/);
});

test("person note links the company and has its body sections", () => {
  const note = personNote({ name: "Jane Doe", company: "[[Acme]]", role: "CEO" });
  assertValid(note);
  assert.equal(parseFrontmatter(note).company, "[[Acme]]");
  assert.equal(parseFrontmatter(note).crm_id, "person-jane-doe");
  assert.match(note, /\n# Jane Doe\n\n## Context\n\n## Opportunities\n\n## History\n$/);
});

test("opportunity note repeats its links in the Company and Contact sections", () => {
  const note = opportunityNote({
    name: "Website redesign", companyLabel: "Acme", company: "[[Acme]]", contact: "[[Jane Doe]]",
    stage: "lead", value: "15000", created: "2026-10-05",
  });
  assertValid(note);
  assert.equal(opportunityTitle("Acme", "Website redesign"), "Acme - Website redesign");
  assert.equal(parseFrontmatter(note).crm_id, "opportunity-acme-website-redesign");
  assert.match(note, /\n# Acme - Website redesign\n\n## Company\n\n\[\[Acme\]\]\n\n## Contact\n\n\[\[Jane Doe\]\]\n\n## Situation\n/);
});

test("opportunity note without a contact keeps an empty Contact section", () => {
  const note = opportunityNote({ name: "Deal", companyLabel: "Acme", company: "[[Acme]]", contact: "", stage: "lead", created: "2026-10-05" });
  assert.match(note, /## Contact\n\n## Situation/);
});

test("interaction note carries the task line under Next action", () => {
  const title = interactionTitle("2026-10-05", "call", "Jane Doe");
  const note = interactionNote({
    title, date: "2026-10-05", kind: "call", people: ["[[Jane Doe]]"], company: "[[Acme]]", opportunity: "",
    nextAction: "Send proposal", nextActionDate: "2026-10-10", summary: "Discussed scope.",
    task: "- [ ] Send proposal 📅 2026-10-10 #crm/follow-up",
  });
  assertValid(note);
  assert.equal(title, "2026-10-05 - call - Jane Doe");
  assert.equal(parseFrontmatter(note).crm_id, "interaction-2026-10-05-call-jane-doe");
  assert.match(note, /## Summary\n\nDiscussed scope\.\n\n## Key points\n\n## Commitments\n\n## Next action\n\n- \[ \] Send proposal/);
});

test("an empty list in frontmatter is written as [] instead of a blank line", () => {
  assert.equal(frontmatter({ people: [], tags: ["x"] }, ""), '---\npeople: []\ntags:\n  - "x"\n---\n\n');
});
