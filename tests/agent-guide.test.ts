import { FakeVault, parseFrontmatter } from "./helpers/fake-obsidian";
import { test } from "node:test";
import assert from "node:assert/strict";
import { CLAUDE_POINTER, mergeUserNotes, renderAgentGuide, updateAgentGuide, USER_NOTES_HEADING, USER_NOTES_MARKER } from "../src/crm/agent-guide";
import { ensureCrmFolders } from "../src/crm/folders";
import { INTERACTION_KINDS, validateFrontmatter } from "../src/crm/integrity";
import { DEFAULT_SETTINGS } from "../src/settings";

const options = {
  root: "Work/CRM",
  stages: ["Lead", "Qualified", "won"],
  kinds: INTERACTION_KINDS,
  taskTag: "#crm/follow-up",
  createTasks: true,
};

function exampleNotes(guide: string): string[] {
  return [...guide.matchAll(/```markdown\n([\s\S]*?)```/g)].map((match) => match[1]);
}

test("the guide is written for the configured folder, stages, kinds and task tag", () => {
  const guide = renderAgentGuide(options);
  assert.match(guide, /`Work\/CRM\/People\/`/);
  assert.match(guide, /`lead`, `qualified`, `won`/);
  for (const kind of INTERACTION_KINDS) assert.match(guide, new RegExp(`\`${kind}\``));
  assert.match(guide, /#crm\/follow-up/);
  assert.match(guide, /`card_order` there is the user's own priority order/);
  assert.ok(guide.includes(`${USER_NOTES_HEADING}\n`));
});

test("every section the guide refers to exists", () => {
  const guide = renderAgentGuide(options);
  const references = [...guide.matchAll(/see "([^"]+)"/g)].map((match) => match[1]);
  assert.ok(references.length >= 3);
  for (const reference of references) assert.match(guide, new RegExp(`^## ${reference}$`, "m"), reference);
});

test("every example note in the guide satisfies the data contract", () => {
  const notes = exampleNotes(renderAgentGuide(options));
  assert.equal(notes.length, 4);
  for (const note of notes) {
    const fm = parseFrontmatter(note);
    assert.deepEqual(validateFrontmatter(String(fm.type), fm, { stages: options.stages }), [], String(fm.type));
  }
});

test("with follow-up tasks disabled the guide tells agents not to add task lines", () => {
  const guide = renderAgentGuide({ ...options, createTasks: false });
  assert.match(guide, /Follow-up tasks are disabled/);
  assert.doesNotMatch(guide, /- \[ \] Send proposal/);
});

test("regenerating keeps whatever the user wrote under Your notes", () => {
  const existing = `${renderAgentGuide(options)}\nAlways tag VIP companies.\n`;
  const regenerated = mergeUserNotes(renderAgentGuide({ ...options, stages: ["lead"] }), existing);
  assert.match(regenerated, /Always tag VIP companies\./);
  assert.match(regenerated, /`lead`\./);
  assert.equal(regenerated.split(USER_NOTES_HEADING).length, 2);
  assert.equal(regenerated.split(USER_NOTES_MARKER).length, 2);
  const fresh = renderAgentGuide({ ...options, stages: ["lead"] });
  assert.equal(mergeUserNotes(fresh, regenerated), regenerated, "regenerating twice changes nothing");
});

test("initializing the CRM writes AGENTS.md and CLAUDE.md and never overwrites them", async () => {
  const vault = new FakeVault();
  const settings = { ...DEFAULT_SETTINGS };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await ensureCrmFolders(vault as any, settings);

  assert.match(vault.content("CRM/AGENTS.md"), /^# CRM — Agent Guide/);
  assert.equal(vault.content("CRM/CLAUDE.md"), CLAUDE_POINTER);

  vault.files.get("CRM/AGENTS.md")!.content = "edited";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await ensureCrmFolders(vault as any, settings);
  assert.equal(vault.content("CRM/AGENTS.md"), "edited");
});

test("updating the guide reads the current Pipeline.md stages and keeps user notes", async () => {
  const vault = new FakeVault();
  const settings = { ...DEFAULT_SETTINGS };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await ensureCrmFolders(vault as any, settings);
  vault.files.get("CRM/Pipeline.md")!.content = "---\ntype: crm/pipeline\nstages:\n  - Discovery\n  - Closed\n---\n";
  vault.files.get("CRM/AGENTS.md")!.content += "\nPrefer meetings over calls.\n";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateAgentGuide(vault as any, settings);

  const guide = vault.content("CRM/AGENTS.md");
  assert.match(guide, /`discovery`, `closed`/);
  assert.match(guide, /Prefer meetings over calls\./);
  assert.equal(parseFrontmatter(guide).type, undefined, "the guide is not a CRM record");
});
