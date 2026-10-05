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

test("logging an interaction respects the follow-up task setting", async () => {
  const { vault, interactions } = setup({ createTasksByDefault: false });
  await interactions.createInteraction(form({ company_new: "Acme", date: "2026-10-05", kind: "call", next_action: "Send proposal" }));

  const content = vault.content("CRM/Interactions/2026-10-05 - call - Acme.md");
  assert.doesNotMatch(content, /- \[ \]/);
  assert.match(content, /## Next action\n\nSend proposal\n$/);
});
