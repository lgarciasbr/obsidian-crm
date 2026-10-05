import { test } from "node:test";
import assert from "node:assert/strict";
import { addListItemToSection, removeListItemFromSection, setSectionBody } from "../src/crm/markdown-sections";
import { frontmatter } from "../src/crm/frontmatter";

const company = "# Acme\n\n## Context\n\n## People\n\n## Opportunities\n\n## History\n";

test("adding a link to an empty section keeps a blank line before the next heading", () => {
  const out = addListItemToSection(company, "Opportunities", "[[Acme - Deal]]");
  assert.equal(out, "# Acme\n\n## Context\n\n## People\n\n## Opportunities\n\n- [[Acme - Deal]]\n\n## History\n");
});

test("adding a second link appends to the same list without blank lines between items", () => {
  const once = addListItemToSection(company, "People", "[[Jane]]");
  const twice = addListItemToSection(once, "People", "[[John]]");
  assert.match(twice, /## People\n\n- \[\[Jane\]\]\n- \[\[John\]\]\n\n## Opportunities/);
});

test("adding an existing link is a no-op", () => {
  const once = addListItemToSection(company, "People", "[[Jane]]");
  assert.equal(addListItemToSection(once, "People", "[[Jane]]"), once);
});

test("adding to the last section ends the file with a single newline", () => {
  const out = addListItemToSection(company, "History", "[[2026-10-05 - call - Jane]]");
  assert.ok(out.endsWith("## History\n\n- [[2026-10-05 - call - Jane]]\n"));
});

test("a missing section is created at the end", () => {
  const out = addListItemToSection("# Jane\n\n## Context\n", "History", "[[x]]");
  assert.equal(out, "# Jane\n\n## Context\n\n## History\n\n- [[x]]\n");
});

test("user text in a section is preserved and the link goes after it", () => {
  const content = "# Acme\n\n## People\n\nKey accounts:\n\n## History\n";
  const out = addListItemToSection(content, "People", "[[Jane]]");
  assert.equal(out, "# Acme\n\n## People\n\nKey accounts:\n\n- [[Jane]]\n\n## History\n");
});

test("removing a link leaves the section tidy", () => {
  const two = addListItemToSection(addListItemToSection(company, "People", "[[Jane]]"), "People", "[[John]]");
  const out = removeListItemFromSection(two, "People", "[[Jane]]");
  assert.match(out, /## People\n\n- \[\[John\]\]\n\n## Opportunities/);
  const empty = removeListItemFromSection(out, "People", "[[John]]");
  assert.equal(empty, company);
});

test("setSectionBody replaces the section content", () => {
  const opp = "# Acme - Deal\n\n## Company\n\nAcme\n\n## Contact\n\n## Situation\n";
  const out = setSectionBody(setSectionBody(opp, "Company", "[[Acme]]"), "Contact", "[[Jane]]");
  assert.equal(out, "# Acme - Deal\n\n## Company\n\n[[Acme]]\n\n## Contact\n\n[[Jane]]\n\n## Situation\n");
  assert.equal(setSectionBody(out, "Contact", ""), "# Acme - Deal\n\n## Company\n\n[[Acme]]\n\n## Contact\n\n## Situation\n");
});

test("empty frontmatter values have no trailing space", () => {
  const out = frontmatter({ type: "crm/company", site: "", tags: ["crm/company"] }, "# X\n");
  assert.equal(out, '---\ntype: "crm/company"\nsite:\ntags:\n  - "crm/company"\n---\n\n# X\n');
});
