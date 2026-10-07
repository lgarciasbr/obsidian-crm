import { FakeFileManager, FakeMetadataCache, FakeVault, fakeWorkspace, parseFrontmatter } from "./helpers/fake-obsidian";
import { test } from "node:test";
import assert from "node:assert/strict";
import { EntityCreator } from "../src/crm/entity-creation";
import { InteractionCreator } from "../src/crm/interactions";
import { DEFAULT_SETTINGS } from "../src/settings";
import type { EntityFormResult } from "../src/crm/types";

function setup() {
  const vault = new FakeVault();
  const cache = new FakeMetadataCache(vault);
  const fileManager = new FakeFileManager(vault);
  const settings = { ...DEFAULT_SETTINGS };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entities = new EntityCreator(vault as any, fakeWorkspace as any, cache as any, fileManager as any, settings);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const interactions = new InteractionCreator(vault as any, fakeWorkspace as any, cache as any, fileManager as any, settings, entities);
  const fm = (path: string) => parseFrontmatter(vault.content(path));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const any = (x: unknown) => x as any;
  return { vault, cache, entities, interactions, fm, any };
}

const form = (values: Record<string, string>) => values as EntityFormResult;

function assertTidy(content: string): void {
  assert.doesNotMatch(content, /\]\]\n##/, "a link must not be glued to the next heading");
  assert.doesNotMatch(content, /\n\n\n/, "no triple newlines");
}

test("new opportunity with a new company and a new contact links everything both ways", async () => {
  const { vault, entities, fm } = setup();
  await entities.createOpportunity(form({ name: "Deal", company_new: "Acme", contact_new: "Jane", stage: "lead" }), false);

  const opp = "CRM/Opportunities/Acme - Deal.md";
  assert.equal(fm(opp).company, "[[Acme]]");
  assert.equal(fm(opp).contact, "[[Jane]]");
  assert.match(vault.content(opp), /## Company\n\n\[\[Acme\]\]\n\n## Contact\n\n\[\[Jane\]\]\n\n## Situation/);

  assert.equal(fm("CRM/People/Jane.md").company, "[[Acme]]");
  assert.match(vault.content("CRM/Companies/Acme.md"), /## People\n\n- \[\[Jane\]\]\n\n## Opportunities\n\n- \[\[Acme - Deal\]\]\n\n## History/);
  assert.match(vault.content("CRM/People/Jane.md"), /## Opportunities\n\n- \[\[Acme - Deal\]\]\n\n## History/);
  for (const path of vault.files.keys()) assertTidy(vault.content(path));
});

test("selecting an existing contact without a company attaches them to the opportunity's company", async () => {
  const { vault, cache, entities, fm } = setup();
  await entities.createCompany(form({ name: "Acme" }), false);
  await entities.createPerson(form({ name: "Jane" }), false);
  cache.indexAll();

  await entities.createOpportunity(form({ name: "Deal", company: "Acme", contact: "Jane", stage: "lead" }), false);

  assert.equal(fm("CRM/People/Jane.md").company, "[[Acme]]");
  assert.match(vault.content("CRM/Companies/Acme.md"), /## People\n\n- \[\[Jane\]\]/);
  assert.match(vault.content("CRM/Opportunities/Acme - Deal.md"), /## Contact\n\n\[\[Jane\]\]/);
});

test("an existing contact who belongs to another company is not moved", async () => {
  const { vault, cache, entities, fm } = setup();
  await entities.createPerson(form({ name: "Jane", company_new: "Globex" }), false);
  await entities.createCompany(form({ name: "Acme" }), false);
  cache.indexAll();

  await entities.createOpportunity(form({ name: "Deal", company: "Acme", contact: "Jane", stage: "lead" }), false);

  assert.equal(fm("CRM/People/Jane.md").company, "[[Globex]]");
  assert.doesNotMatch(vault.content("CRM/Companies/Acme.md"), /\[\[Jane\]\]/);
});

test("new person with a new company is listed under the company", async () => {
  const { vault, entities, fm } = setup();
  await entities.createPerson(form({ name: "Jane", company_new: "Acme" }), false);

  assert.equal(fm("CRM/People/Jane.md").company, "[[Acme]]");
  assert.match(vault.content("CRM/Companies/Acme.md"), /## People\n\n- \[\[Jane\]\]\n\n## Opportunities/);
});

test("a new company whose name is taken links to the file actually created", async () => {
  const { cache, entities, fm } = setup();
  await entities.createCompany(form({ name: "Acme" }), false);
  cache.indexAll();

  await entities.createPerson(form({ name: "Jane", company_new: "Acme" }), false);

  assert.equal(fm("CRM/People/Jane.md").company, "[[Acme 2]]");
});

test("logging an interaction with a new person creates them and links history on every side", async () => {
  const { vault, cache, entities, interactions, fm } = setup();
  await entities.createOpportunity(form({ name: "Deal", company_new: "Acme", stage: "lead" }), false);
  cache.indexAll();

  await interactions.createInteraction(form({
    person_new: "Jane", company: "Acme", opportunity: "Acme - Deal",
    date: "2026-10-05", kind: "call", next_action: "Send proposal", next_action_date: "2026-10-10",
  }));

  const interaction = "CRM/Interactions/2026-10-05 - call - Jane.md";
  assert.deepEqual(fm(interaction).people, ["[[Jane]]"]);
  assert.equal(fm(interaction).company, "[[Acme]]");
  assert.equal(fm(interaction).opportunity, "[[Acme - Deal]]");
  assert.equal(fm("CRM/People/Jane.md").company, "[[Acme]]");
  for (const path of ["CRM/People/Jane.md", "CRM/Companies/Acme.md", "CRM/Opportunities/Acme - Deal.md"]) {
    assert.match(vault.content(path), /## History\n\n- \[\[2026-10-05 - call - Jane\]\]\n$/);
    assert.equal(fm(path).last_contact, "2026-10-05");
    assert.equal(fm(path).next_action, "Send proposal");
  }
  assert.match(vault.content("CRM/Companies/Acme.md"), /## People\n\n- \[\[Jane\]\]/);
});

test("editing an opportunity to a new company moves every reference", async () => {
  const { vault, cache, entities, fm } = setup();
  await entities.createOpportunity(form({ name: "Deal", company_new: "Acme", contact_new: "Jane", stage: "lead" }), false);
  cache.indexAll();

  const file = vault.files.get("CRM/Opportunities/Acme - Deal.md")!.file;
  await entities.updateOpportunity(file as never, form({ name: "Deal", company_new: "Globex", contact: "Jane", stage: "proposal" }));

  const opp = "CRM/Opportunities/Globex - Deal.md";
  assert.equal(fm(opp).company, "[[Globex]]");
  assert.equal(fm(opp).stage, "proposal");
  assert.match(vault.content(opp), /^# Globex - Deal$/m);
  assert.match(vault.content(opp), /## Company\n\n\[\[Globex\]\]\n\n## Contact\n\n\[\[Jane\]\]/);
  assert.doesNotMatch(vault.content("CRM/Companies/Acme.md"), /Deal/);
  assert.match(vault.content("CRM/Companies/Globex.md"), /## Opportunities\n\n- \[\[Globex - Deal\]\]/);
  assert.match(vault.content("CRM/People/Jane.md"), /## Opportunities\n\n- \[\[Globex - Deal\]\]\n\n## History/);
});

test("deleting an opportunity removes its links and its place in the board order", async () => {
  const { vault, cache, entities, fm } = setup();
  await entities.createOpportunity(form({ name: "Deal", company_new: "Acme", contact_new: "Jane", stage: "lead" }), false);
  cache.indexAll();
  await entities.createOpportunity(form({ name: "Other", company: "Acme", stage: "lead" }), false);
  cache.indexAll();
  const pipeline = vault.files.get("CRM/Pipeline.md")!;
  pipeline.content = pipeline.content.replace("---\n\n# Pipeline", "card_order:\n  - opportunity-acme-deal\n  - opportunity-acme-other\n---\n\n# Pipeline");

  const deal = vault.files.get("CRM/Opportunities/Acme - Deal.md")!.file;
  await entities.deleteOpportunity(deal as never);

  assert.equal(vault.files.has("CRM/Opportunities/Acme - Deal.md"), false);
  assert.deepEqual(vault.trashed, ["CRM/Opportunities/Acme - Deal.md"]);
  assert.doesNotMatch(vault.content("CRM/Companies/Acme.md"), /Acme - Deal/);
  assert.match(vault.content("CRM/Companies/Acme.md"), /- \[\[Acme - Other\]\]/);
  assert.doesNotMatch(vault.content("CRM/People/Jane.md"), /Acme - Deal/);
  assert.deepEqual(fm("CRM/Pipeline.md").card_order, ["opportunity-acme-other"]);
});

test("listing records walks only the CRM folder, not the whole vault", async () => {
  const { vault, cache, entities, any } = setup();
  await entities.createCompany(form({ name: "Acme" }), false);
  await vault.create("Elsewhere/Company look-alike.md", '---\ntype: "crm/company"\nname: "Fake"\n---\n');
  cache.indexAll();
  vault.getMarkdownFiles = () => {
    throw new Error("the whole vault must not be scanned");
  };

  const { CrmRepository } = await import("../src/crm/repository");
  const names = new CrmRepository(any(vault), any(cache), { ...DEFAULT_SETTINGS }).listRecords("crm/company").map((r) => r.name);
  assert.deepEqual(names, ["Acme"]);
});
