import "./helpers/fake-obsidian";
import { test } from "node:test";
import assert from "node:assert/strict";
import type { App } from "obsidian";
import { EntityModal } from "../src/ui/entity-modal";
import { EntityField, EntityFormResult, PendingFollowUp } from "../src/crm/types";
import { UiElement } from "./helpers/fake-ui";

const pending: PendingFollowUp[] = [
  { path: "CRM/People/Jane.md", label: "Person: Jane", action: "Sign contract", date: "2026-10-31" },
  { path: "CRM/Companies/Acme.md", label: "Company: Acme", action: "Renew hosting", date: "2026-11-10" },
];
const fields: EntityField[] = [
  { key: "person", label: "Person", options: ["Jane", "Other"], defaultValue: "Jane" },
  { key: "next_action", label: "Next action" },
  { key: "next_action_date", label: "Next action date", inputType: "date" },
];

function open(records = pending) {
  const saved: EntityFormResult[] = [];
  const modal = new EntityModal({} as App, "Log interaction", fields, async (values) => {
    saved.push({ ...values });
  }, "Log interaction", () => records);
  modal.onOpen();
  const el = modal.contentEl as unknown as UiElement;
  const setting = (name: string) => {
    const found = el.allSettings().find((s) => s.name === name);
    assert.ok(found, `Missing setting: ${name}`);
    return found;
  };
  const button = el.allSettings().find((s) => s.controls.some((c) => c.value === "Log interaction"))!.controls[0];
  const save = async () => {
    button.select("");
    await new Promise((r) => setImmediate(r));
  };
  return { modal, el, saved, setting, save };
}

const completeLabel = "Complete current follow-up — no next action";

test("original two fields stay visible and filling them replaces the action", async () => {
  const { el, saved, setting, save } = open();
  assert.ok(setting("Next action"));
  assert.ok(setting("Next action date"));
  assert.equal(setting(completeLabel).controls[0].value, false);
  assert.equal(el.allSettings().some((s) => s.name === "After this interaction"), false);
  assert.equal(el.allSettings().some((s) => s.name === "Person: Jane"), false);
  setting("Next action").controls[0].select("Schedule onboarding");
  setting("Next action date").controls[0].select("2026-11-03");
  await save();
  assert.equal(saved[0].next_action, "Schedule onboarding");
  assert.equal(saved[0].next_action_date, "2026-11-03");
});

test("different actions require selection only after checking complete", async () => {
  const { saved, setting, save } = open();
  setting(completeLabel).controls[0].select(true);
  await save();
  assert.equal(saved.length, 0);
  setting("Person: Jane").controls[0].select(true);
  await save();
  assert.deepEqual(JSON.parse(saved[0].complete_follow_ups), [pending[0]]);
});

test("one shared action completes directly without extra selectors", async () => {
  const shared = [pending[0], { ...pending[1], action: pending[0].action, date: pending[0].date }];
  const { saved, el, setting, save } = open(shared);
  setting(completeLabel).controls[0].select(true);
  assert.equal(setting("Next action").controls[0].disabled, true);
  assert.equal(setting("Next action date").controls[0].disabled, true);
  assert.equal(el.allSettings().some((s) => s.name === "Person: Jane"), false);
  await save();
  assert.deepEqual(JSON.parse(saved[0].complete_follow_ups), shared);
});

test("switching a related record resets completion consent", () => {
  const { setting } = open();
  setting(completeLabel).controls[0].select(true);
  setting("Person: Jane").controls[0].select(true);
  setting("Person").controls[0].select("Other");
  assert.equal(setting(completeLabel).controls[0].value, false);
  setting(completeLabel).controls[0].select(true);
  assert.equal(setting("Person: Jane").controls[0].value, false);
});

test("without a pending action only the original two fields are shown", () => {
  const { el, setting } = open([]);
  assert.ok(setting("Next action"));
  assert.ok(setting("Next action date"));
  assert.equal(el.allSettings().some((s) => s.name === completeLabel), false);
});

test("unchecking completion restores replacement behavior", async () => {
  const { saved, setting, save } = open([pending[0]]);
  setting("Next action").controls[0].select("Next draft");
  setting(completeLabel).controls[0].select(true);
  setting(completeLabel).controls[0].select(false);
  assert.equal(setting("Next action").controls[0].disabled, false);
  await save();
  assert.equal(saved[0].next_action, "Next draft");
  assert.notEqual(saved[0].next_action_mode, "complete");
});
