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

test("cleanLink strips wikilink brackets and aliases", async () => {
  const { cleanLink } = await import("../src/crm/links");
  assert.equal(cleanLink("[[Acme]]"), "Acme");
  assert.equal(cleanLink("[[Acme - Deal|Deal]]"), "Acme - Deal");
  assert.equal(cleanLink("  Acme "), "Acme");
});

test("frontmatter values are read defensively", async () => {
  const { listValue, textValue } = await import("../src/crm/values");
  assert.equal(textValue("  Acme "), "Acme");
  assert.equal(textValue(15000), "15000");
  assert.equal(textValue(new Date("2026-10-05T00:00:00Z")), "2026-10-05");
  assert.equal(textValue({ nested: true }), "");
  assert.equal(textValue(null), "");
  assert.deepEqual(listValue(["a", 2, { x: 1 }, ""]), ["a", "2"]);
  assert.deepEqual(listValue("not a list"), []);
});

test("company rows count the people and opportunities linked to them", async () => {
  const { contactViewModels } = await import("../src/views/contact-list");
  const record = (type: string, name: string, frontmatter: Record<string, unknown> = {}) =>
    ({ type, name, basename: name, path: `${name}.md`, frontmatter }) as never;
  const rows = contactViewModels(
    [record("crm/person", "Jane", { company: "[[Acme]]", email: "jane@acme.example" }), record("crm/person", "Bob")],
    [record("crm/company", "Acme", { site: "acme.example" }), record("crm/company", "Globex")],
    [record("crm/opportunity", "Deal", { company: "[[Acme]]" }), record("crm/opportunity", "Other", { company: "[[Acme|A]]" })]
  );
  const acme = rows.find((row) => row.name === "Acme")!;
  assert.equal(acme.peopleCount, 1);
  assert.equal(acme.opportunityCount, 2);
  assert.equal(rows.find((row) => row.name === "Globex")!.opportunityCount, 0);
  assert.equal(rows.find((row) => row.name === "Jane")!.company, "Acme");
  assert.deepEqual(rows.map((row) => row.name), ["Acme", "Bob", "Globex", "Jane"]);
});
