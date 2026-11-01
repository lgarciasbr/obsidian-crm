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

test("modal defaults to keep and reveals replacement fields only on request", async () => {
  const { el, saved, setting, save } = open();
  assert.equal(setting("After this interaction").controls[0].value, "keep");
  assert.equal(el.allSettings().some((s) => s.name === "Next action"), false);
  setting("After this interaction").controls[0].select("replace");
  await save();
  assert.equal(saved.length, 0); // empty replacement is not accepted
  setting("Next action").controls[0].select("Schedule onboarding");
  setting("Next action date").controls[0].select("2026-11-03");
  await save();
  assert.equal(saved[0].next_action, "Schedule onboarding");
  assert.equal(saved[0].next_action_date, "2026-11-03");
});

test("completion requires explicit target selection and submits only the selected snapshot", async () => {
  const { saved, setting, save } = open();
  setting("After this interaction").controls[0].select("complete");
  await save();
  assert.equal(saved.length, 0);
  setting("Person: Jane").controls[0].select(true);
  await save();
  assert.deepEqual(JSON.parse(saved[0].complete_follow_ups), [pending[0]]);
});

test("switching a related record resets completion consent", () => {
  const { setting } = open();
  setting("After this interaction").controls[0].select("complete");
  setting("Person: Jane").controls[0].select(true);
  setting("Person").controls[0].select("Other");
  assert.equal(setting("After this interaction").controls[0].value, "keep");
  setting("After this interaction").controls[0].select("complete");
  assert.equal(setting("Person: Jane").controls[0].value, false);
});

test("without a pending action only the define-next-action toggle is shown", () => {
  const { el, setting } = open([]);
  assert.equal(el.allSettings().some((s) => s.name === "After this interaction"), false);
  setting("Define a next action").controls[0].select(true);
  assert.ok(setting("Next action"));
  setting("Define a next action").controls[0].select(false);
  assert.equal(el.allSettings().some((s) => s.name === "Next action"), false);
});
