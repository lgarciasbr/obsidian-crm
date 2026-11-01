import { FakeFileManager, FakeMetadataCache, FakeVault, fakeWorkspace, parseFrontmatter } from "./helpers/fake-obsidian";
import { test } from "node:test";
import assert from "node:assert/strict";
import { EntityCreator } from "../src/crm/entity-creation";
import { InteractionCreator } from "../src/crm/interactions";
import { followUpTask, setNextAction } from "../src/crm/next-action";
import { DEFAULT_SETTINGS } from "../src/settings";
import type { EntityFormResult } from "../src/crm/types";

function setup(overrides: Partial<typeof DEFAULT_SETTINGS> = {}) {
  const vault = new FakeVault();
  const cache = new FakeMetadataCache(vault);
  const fileManager = new FakeFileManager(vault);
  const settings = { ...DEFAULT_SETTINGS, ...overrides };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const any = (x: unknown) => x as any;
  const entities = new EntityCreator(any(vault), any(fakeWorkspace), any(cache), any(fileManager), settings);
  const interactions = new InteractionCreator(any(vault), any(fakeWorkspace), any(cache), any(fileManager), settings, entities);
  return { vault, cache, fileManager, settings, entities, interactions, any };
}

const form = (values: Record<string, string>) => values as EntityFormResult;

test("followUpTask builds a Tasks-compatible line", () => {
  assert.equal(followUpTask("Call Jane", "2026-10-10", "#crm/follow-up"), "- [ ] Call Jane 📅 2026-10-10 #crm/follow-up");
  assert.equal(followUpTask("Call Jane", "", ""), "- [ ] Call Jane");
  assert.equal(followUpTask("  ", "2026-10-10", "#x"), "");
});

test("set next action updates frontmatter and keeps a single Next action section", async () => {
  const { vault, fileManager, settings, entities, any } = setup();
  await entities.createCompany(form({ name: "Acme" }), false);
  const file = vault.files.get("CRM/Companies/Acme.md")!.file;

  await setNextAction(any(vault), any(fileManager), any(file), "Send proposal", "2026-10-10", settings);
  await setNextAction(any(vault), any(fileManager), any(file), "Follow up", "2026-10-20", settings);
  await setNextAction(any(vault), any(fileManager), any(file), "Follow up", "2026-10-20", settings);

  const content = vault.content("CRM/Companies/Acme.md");
  const fm = parseFrontmatter(content);
  assert.equal(fm.next_action, "Follow up");
  assert.equal(fm.next_action_date, "2026-10-20");
  assert.equal(content.match(/^## Next action$/gm)?.length, 1);
  assert.match(content, /## Next action\n\n- \[ \] Send proposal 📅 2026-10-10 #crm\/follow-up\n- \[ \] Follow up 📅 2026-10-20 #crm\/follow-up\n$/);
});

test("set next action adds no task when follow-up tasks are disabled", async () => {
  const { vault, fileManager, settings, entities, any } = setup({ createTasksByDefault: false });
  await entities.createCompany(form({ name: "Acme" }), false);
  const file = vault.files.get("CRM/Companies/Acme.md")!.file;

  await setNextAction(any(vault), any(fileManager), any(file), "Send proposal", "2026-10-10", settings);

  assert.equal(parseFrontmatter(vault.content("CRM/Companies/Acme.md")).next_action, "Send proposal");
  assert.doesNotMatch(vault.content("CRM/Companies/Acme.md"), /- \[ \]/);
});

test("complete only the selected follow-up, preserving other related records", async () => {
  const { vault, cache, fileManager, settings, entities, interactions, any } = setup();
  await entities.createCompany(form({ name: "Acme" }), false);
  await entities.createPerson(form({ name: "Jane", company: "Acme" }));
  cache.indexAll();
  const company = vault.files.get("CRM/Companies/Acme.md")!.file;
  const person = vault.files.get("CRM/People/Jane.md")!.file;
  await setNextAction(any(vault), any(fileManager), any(company), "Renew hosting", "2026-11-10", settings);
  await setNextAction(any(vault), any(fileManager), any(person), "Sign contract", "2026-10-31", settings);
  cache.indexAll();
  await interactions.createInteraction(form({ person: "Jane", company: "Acme", date: "2026-10-31", kind: "note",
    summary: "Client signed the contract.", next_action_mode: "complete",
    complete_follow_ups: JSON.stringify([{ path: person.path, action: "Sign contract", date: "2026-10-31" }]),
  }));
  const personFm = parseFrontmatter(vault.content(person.path));
  assert.equal(personFm.next_action, "");
  assert.equal(personFm.next_action_date, "");
  assert.equal(personFm.last_contact, "2026-10-31");
  assert.match(vault.content(person.path), /- \[x\] Sign contract/);
  assert.equal(parseFrontmatter(vault.content(company.path)).next_action, "Renew hosting");
  assert.equal(parseFrontmatter(vault.content(company.path)).next_action_date, "2026-11-10");
  assert.match(vault.content("CRM/Interactions/2026-10-31 - note - Jane.md"), /Completed follow-up on \[\[Jane\]\]: Sign contract/);
});

test("historical shared checkbox is completed only after all its pending records are completed", async () => {
  const { vault, cache, entities, interactions } = setup();
  await entities.createCompany(form({ name: "Acme" }), false);
  await entities.createPerson(form({ name: "Jane", company: "Acme" }));
  cache.indexAll();
  await interactions.createInteraction(form({ person: "Jane", company: "Acme", date: "2026-10-01",
    kind: "call", next_action: "Sign contract", next_action_date: "2026-10-31" }));
  cache.indexAll();
  const history = "CRM/Interactions/2026-10-01 - call - Jane.md";
  const complete = async (path: string, day: string) => {
    await interactions.createInteraction(form({ person: "Jane", company: "Acme", date: day,
      next_action_mode: "complete", complete_follow_ups: JSON.stringify([
        { path, action: "Sign contract", date: "2026-10-31" },
      ]) }));
    cache.indexAll();
  };
  await complete("CRM/People/Jane.md", "2026-10-30");
  assert.match(vault.content(history), /- \[ \] Sign contract/); // company still pending
  await complete("CRM/Companies/Acme.md", "2026-10-31");
  assert.match(vault.content(history), /- \[x\] Sign contract/);
  assert.equal(parseFrontmatter(vault.content("CRM/People/Jane.md")).next_action, "");
  assert.equal(parseFrontmatter(vault.content("CRM/Companies/Acme.md")).next_action, "");
});

test("explicit keep ignores hidden replacement values", async () => {
  const { vault, cache, fileManager, settings, entities, interactions, any } = setup();
  await entities.createCompany(form({ name: "Acme" }), false);
  const file = vault.files.get("CRM/Companies/Acme.md")!.file;
  await setNextAction(any(vault), any(fileManager), any(file), "Sign contract", "2026-10-31", settings);
  cache.indexAll();
  await interactions.createInteraction(form({ company: "Acme", date: "2026-10-31", next_action_mode: "keep",
    next_action: "Hidden draft", next_action_date: "2026-11-20" }));
  assert.equal(parseFrontmatter(vault.content(file.path)).next_action, "Sign contract");
  assert.doesNotMatch(vault.content("CRM/Interactions/2026-10-31 - note - Acme.md"), /Hidden draft/);
});

test("completion rejects stale, unrelated and empty selections before creating an interaction", async () => {
  const { vault, cache, fileManager, settings, entities, interactions, any } = setup();
  await entities.createCompany(form({ name: "Acme" }), false);
  const file = vault.files.get("CRM/Companies/Acme.md")!.file;
  await setNextAction(any(vault), any(fileManager), any(file), "New task", "2026-11-10", settings);
  cache.indexAll();
  for (const selected of [[], [{ path: file.path, action: "Old task", date: "2026-10-31" }],
    [{ path: "CRM/People/Other.md", action: "New task", date: "2026-11-10" }]]) {
    await assert.rejects(interactions.createInteraction(form({ company: "Acme", date: "2026-10-31",
      next_action_mode: "complete", complete_follow_ups: JSON.stringify(selected) })));
  }
  assert.equal([...vault.files.keys()].filter((p) => p.startsWith("CRM/Interactions/")).length, 0);
  assert.equal(parseFrontmatter(vault.content(file.path)).next_action, "New task");
});

test("signed contract clears the shared follow-up on person, company and opportunity, not the history", async () => {
  const { vault, cache, entities, interactions } = setup();
  await entities.createOpportunity(form({ name: "Deal", company_new: "Acme", contact_new: "Jane", stage: "lead" }), false);
  cache.indexAll();
  const related = { person: "Jane", company: "Acme", opportunity: "Acme - Deal" };
  const paths = ["CRM/People/Jane.md", "CRM/Companies/Acme.md", "CRM/Opportunities/Acme - Deal.md"];
  await interactions.createInteraction(form({ ...related, date: "2026-10-01", kind: "call",
    next_action: "Sign contract", next_action_date: "2026-10-31" }));
  cache.indexAll();
  await interactions.createInteraction(form({ ...related, date: "2026-10-31", kind: "note",
    summary: "Client signed the contract.", next_action_mode: "complete",
    next_action: "Hidden draft must not become a new task", next_action_date: "2026-12-01",
    complete_follow_ups: JSON.stringify(paths.map((path) => ({ path, action: "Sign contract", date: "2026-10-31" }))),
  }));
  for (const path of paths) {
    const fm = parseFrontmatter(vault.content(path));
    assert.equal(fm.next_action, "");
    assert.equal(fm.next_action_date, "");
    assert.equal(fm.last_contact, "2026-10-31");
    assert.match(vault.content(path), /2026-10-31 - note - Jane/);
  }
  const original = vault.content("CRM/Interactions/2026-10-01 - call - Jane.md");
  assert.equal(parseFrontmatter(original).next_action, "Sign contract");
  assert.match(original, /- \[x\] Sign contract/);
  const current = vault.content("CRM/Interactions/2026-10-31 - note - Jane.md");
  assert.match(current, /Client signed the contract/);
  assert.equal((current.match(/Completed follow-up on/g) || []).length, 3);
  assert.doesNotMatch(current, /Hidden draft/);
});

test("blank fields keep the action and date; a filled action replaces both", async () => {
  const { vault, cache, entities, interactions } = setup();
  await entities.createCompany(form({ name: "Acme" }), false);
  cache.indexAll();
  await interactions.createInteraction(form({ company: "Acme", date: "2026-10-01",
    next_action: "Sign contract", next_action_date: "2026-10-31" }));
  cache.indexAll();
  await interactions.createInteraction(form({ company: "Acme", date: "2026-10-20", next_action: "", next_action_date: "" }));
  let fm = parseFrontmatter(vault.content("CRM/Companies/Acme.md"));
  assert.equal(fm.next_action, "Sign contract");
  assert.equal(fm.next_action_date, "2026-10-31");
  await interactions.createInteraction(form({ company: "Acme", date: "2026-10-31",
    next_action: "Schedule onboarding", next_action_date: "" }));
  fm = parseFrontmatter(vault.content("CRM/Companies/Acme.md"));
  assert.equal(fm.next_action, "Schedule onboarding");
  assert.equal(fm.next_action_date, ""); // no old date leaking into the new task
});

test("completion works with task generation disabled and does not roll last contact back", async () => {
  const { vault, cache, entities, interactions } = setup({ createTasksByDefault: false });
  await entities.createCompany(form({ name: "Acme" }), false);
  cache.indexAll();
  await interactions.createInteraction(form({ company: "Acme", date: "2026-11-03",
    next_action: "Sign contract", next_action_date: "2026-10-31" }));
  cache.indexAll();
  await interactions.createInteraction(form({ company: "Acme", date: "2026-10-31", next_action_mode: "complete",
    complete_follow_ups: JSON.stringify([{ path: "CRM/Companies/Acme.md", action: "Sign contract", date: "2026-10-31" }]),
  }));
  const fm = parseFrontmatter(vault.content("CRM/Companies/Acme.md"));
  assert.equal(fm.next_action, "");
  assert.equal(fm.next_action_date, "");
  assert.equal(fm.last_contact, "2026-11-03");
  assert.doesNotMatch(vault.content("CRM/Interactions/2026-10-31 - note - Acme.md"), /- \[ \]/);
});

test("logging an interaction respects the follow-up task setting", async () => {
  const { vault, interactions } = setup({ createTasksByDefault: false });
  await interactions.createInteraction(form({ company_new: "Acme", date: "2026-10-05", kind: "call", next_action: "Send proposal" }));

  const content = vault.content("CRM/Interactions/2026-10-05 - call - Acme.md");
  assert.doesNotMatch(content, /- \[ \]/);
  assert.match(content, /## Next action\n\nSend proposal\n$/);
});
