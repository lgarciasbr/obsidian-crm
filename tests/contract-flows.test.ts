import { FakeFileManager, FakeMetadataCache, FakeVault, fakeWorkspace, parseFrontmatter } from "./helpers/fake-obsidian";
import { test } from "node:test";
import assert from "node:assert/strict";
import { EntityCreator } from "../src/crm/entity-creation";
import { InteractionCreator } from "../src/crm/interactions";
import { ensureCrmFolders } from "../src/crm/folders";
import { DEFAULT_STAGES } from "../src/crm/integrity";
import { validateRecords, RecordInput } from "../src/crm/validator";
import { DEFAULT_SETTINGS } from "../src/settings";
import type { EntityFormResult } from "../src/crm/types";

function setup() {
  const vault = new FakeVault();
  const cache = new FakeMetadataCache(vault);
  const fileManager = new FakeFileManager(vault);
  const settings = { ...DEFAULT_SETTINGS };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const any = (x: unknown) => x as any;
  const entities = new EntityCreator(any(vault), any(fakeWorkspace), any(cache), any(fileManager), settings);
  const interactions = new InteractionCreator(any(vault), any(fakeWorkspace), any(cache), any(fileManager), settings, entities);
  const fm = (path: string) => parseFrontmatter(vault.content(path));
  return { vault, cache, entities, interactions, fm, any };
}

const form = (values: Record<string, string>) => values as EntityFormResult;
const interaction = (values: Record<string, string>) => form({ kind: "call", ...values });

test("initializing creates the folders and a Pipeline.md with the default stages", async () => {
  const { vault, any } = setup();
  await ensureCrmFolders(any(vault), "CRM");

  for (const folder of ["CRM", "CRM/People", "CRM/Companies", "CRM/Opportunities", "CRM/Interactions"]) {
    assert.ok(vault.folders.has(folder), folder);
  }
  assert.deepEqual(parseFrontmatter(vault.content("CRM/Pipeline.md")).stages, [...DEFAULT_STAGES]);
});

test("R1: logging an older interaction never rolls back last_contact", async () => {
  const { cache, interactions, fm } = setup();
  await interactions.createInteraction(interaction({ company_new: "Acme", date: "2026-10-05" }));
  cache.indexAll();
  await interactions.createInteraction(interaction({ company: "Acme", date: "2026-09-01" }));

  assert.equal(fm("CRM/Companies/Acme.md").last_contact, "2026-10-05");
});

test("R2: an interaction without a next action keeps the pending one", async () => {
  const { cache, interactions, fm } = setup();
  await interactions.createInteraction(interaction({
    company_new: "Acme", date: "2026-10-05", next_action: "Send proposal", next_action_date: "2026-10-10",
  }));
  cache.indexAll();
  await interactions.createInteraction(interaction({ company: "Acme", date: "2026-10-06" }));

  const company = fm("CRM/Companies/Acme.md");
  assert.equal(company.next_action, "Send proposal");
  assert.equal(company.next_action_date, "2026-10-10");
  assert.equal(company.last_contact, "2026-10-06");
});

test("an interaction logged from a card links the existing records without creating new ones", async () => {
  const { vault, cache, entities, interactions, fm } = setup();
  await entities.createOpportunity(form({ name: "Deal", company_new: "Acme", contact_new: "Jane", stage: "lead" }), false);
  cache.indexAll();
  const before = vault.files.size;

  await interactions.createInteraction(interaction({ person: "Jane", company: "Acme", opportunity: "Acme - Deal", date: "2026-10-05" }));

  assert.equal(vault.files.size, before + 1, "only the interaction note is created");
  const note = "CRM/Interactions/2026-10-05 - call - Jane.md";
  assert.deepEqual(fm(note).people, ["[[Jane]]"]);
  assert.equal(fm(note).opportunity, "[[Acme - Deal]]");
});

test("two interactions with the same date, kind and person get distinct files and history entries", async () => {
  const { vault, cache, interactions } = setup();
  await interactions.createInteraction(interaction({ person_new: "Jane", date: "2026-10-05" }));
  cache.indexAll();
  await interactions.createInteraction(interaction({ person: "Jane", date: "2026-10-05" }));

  assert.ok(vault.files.has("CRM/Interactions/2026-10-05 - call - Jane 2.md"));
  assert.match(vault.content("CRM/People/Jane.md"), /## History\n\n- \[\[2026-10-05 - call - Jane\]\]\n- \[\[2026-10-05 - call - Jane 2\]\]\n$/);
});

test("everything the flows write satisfies the data contract", async () => {
  const { vault, cache, entities, interactions } = setup();
  await entities.createCompany(form({ name: "Globex", site: "https://globex.test", industry: "Consulting" }), false);
  await entities.createPerson(form({ name: "Jane", company_new: "Acme", role: "CEO", email: "jane@acme.test" }), false);
  await entities.createOpportunity(form({ name: "Deal", company_new: "Initech", contact_new: "Bob", stage: "proposal", value: "15000" }), false);
  cache.indexAll();
  await interactions.createInteraction(interaction({
    person: "Jane", company: "Acme", date: "2026-10-05", kind: "meeting", next_action: "Send proposal", next_action_date: "2026-10-10",
  }));
  const deal = vault.files.get("CRM/Opportunities/Initech - Deal.md")!.file;
  await entities.updateOpportunity(deal as never, form({ name: "Deal", company: "Globex", contact: "Jane", stage: "negotiation" }));

  const records: RecordInput[] = [...vault.files.values()]
    .map(({ file, content }) => ({ file, frontmatter: parseFrontmatter(content) }))
    .filter(({ frontmatter }) => String(frontmatter.type).startsWith("crm/") && frontmatter.type !== "crm/pipeline")
    .map(({ file, frontmatter }) => ({
      type: String(frontmatter.type),
      name: String(frontmatter.name ?? file.basename),
      basename: file.basename,
      path: file.path,
      frontmatter,
    }));

  const report = validateRecords(records, [...DEFAULT_STAGES]);
  assert.equal(report.total, 7);
  assert.deepEqual(report.records, []);
  assert.deepEqual(report.duplicates, []);
});
