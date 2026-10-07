import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isIsoDate,
  resolveLastContact,
  resolveNextAction,
  validateFrontmatter,
  findDuplicateBasenames,
  resolveUnique,
} from "../src/crm/integrity";

test("isIsoDate accepts valid dates and empty, rejects garbage", () => {
  assert.equal(isIsoDate("2026-07-07"), true);
  assert.equal(isIsoDate(""), true);
  assert.equal(isIsoDate("tomorrow"), false);
  assert.equal(isIsoDate("2026-13-01"), false);
  assert.equal(isIsoDate("2026-02-30"), false);
  assert.equal(isIsoDate("07/07/2026"), false);
});

// R1
test("R1: last_contact never rolls back to an older date", () => {
  assert.equal(resolveLastContact("2026-07-05", "2026-07-01"), "2026-07-05");
  assert.equal(resolveLastContact("2026-07-01", "2026-07-05"), "2026-07-05");
  assert.equal(resolveLastContact("", "2026-07-05"), "2026-07-05");
  assert.equal(resolveLastContact("2026-07-05", ""), "2026-07-05");
  assert.equal(resolveLastContact("2026-07-05", "lixo"), "2026-07-05");
});

// R2 — the destructive bug we are fixing
test("R2: empty incoming next_action must NOT wipe an existing follow-up", () => {
  const existing = { action: "Enviar proposta", date: "2026-07-10" };
  const kept = resolveNextAction(existing, "", "");
  assert.deepEqual(kept, { action: "Enviar proposta", date: "2026-07-10" });
});

test("R2: a real incoming next_action replaces the existing one", () => {
  const existing = { action: "Enviar proposta", date: "2026-07-10" };
  const updated = resolveNextAction(existing, "Ligar de volta", "2026-07-12");
  assert.deepEqual(updated, { action: "Ligar de volta", date: "2026-07-12" });
});

// R3/R4/R5
test("valid person passes, bad date fails", () => {
  assert.deepEqual(
    validateFrontmatter("crm/person", {
      type: "crm/person", crm_id: "person-maria", name: "Maria", last_contact: "2026-07-05",
    }),
    []
  );
  const bad = validateFrontmatter("crm/person", {
    type: "crm/person", crm_id: "person-x", name: "X", next_action_date: "tomorrow",
  });
  assert.deepEqual(bad.map((v) => v.code), ["BAD_DATE"]);
});

test("empty/null optional enum (stage) is NOT flagged (YAML empty field = null)", () => {
  assert.deepEqual(
    validateFrontmatter("crm/opportunity", {
      type: "crm/opportunity", crm_id: "o", name: "X", stage: null, created: "",
    }),
    []
  );
  assert.deepEqual(
    validateFrontmatter("crm/opportunity", {
      type: "crm/opportunity", crm_id: "o", name: "X", stage: "",
    }),
    []
  );
});

test("missing required fields are reported", () => {
  const v = validateFrontmatter("crm/company", { type: "crm/company" });
  assert.ok(v.some((x) => x.code === "MISSING_REQUIRED" && x.field === "crm_id"));
  assert.ok(v.some((x) => x.code === "MISSING_REQUIRED" && x.field === "name"));
});

test("opportunity stage/status validated against contract", () => {
  const ok = validateFrontmatter("crm/opportunity", {
    type: "crm/opportunity", crm_id: "o-1", name: "Diag", stage: "proposal", created: "2026-07-01",
  });
  assert.deepEqual(ok, []);
  const bad = validateFrontmatter("crm/opportunity", {
    type: "crm/opportunity", crm_id: "o-2", name: "Diag", stage: "meeting",
  });
  assert.equal(bad.filter((x) => x.code === "BAD_ENUM").length, 1);
});

test("interaction requires a valid date and known kind", () => {
  const ok = validateFrontmatter("crm/interaction", {
    type: "crm/interaction", crm_id: "i-1", date: "2026-07-07", kind: "call",
  });
  assert.deepEqual(ok, []);
  const bad = validateFrontmatter("crm/interaction", {
    type: "crm/interaction", crm_id: "i-1", date: "", kind: "zap",
  });
  assert.ok(bad.some((x) => x.field === "date"));
  assert.ok(bad.some((x) => x.field === "kind"));
});

// R6
test("duplicate basenames per type are detected", () => {
  const dups = findDuplicateBasenames([
    { type: "crm/person", basename: "João" },
    { type: "crm/person", basename: "joão" },
    { type: "crm/company", basename: "João" },
  ]);
  assert.equal(dups.length, 1);
  assert.equal(dups[0].code, "DUPLICATE_BASENAME");
});

// §3 link resolution
test("resolveUnique refuses to guess on ambiguous names", () => {
  const candidates = [
    { basename: "João Silva", name: "João Silva" },
    { basename: "João Souza", name: "João Souza" },
  ];
  assert.deepEqual(resolveUnique("desconhecido", candidates), { status: "none" });
  assert.deepEqual(resolveUnique("João Silva", candidates), { status: "unique", basename: "João Silva" });
  // Two people literally named the same -> ambiguous, never silently picked.
  const twins = [
    { basename: "João", name: "João" },
    { basename: "João 2", name: "João" },
  ];
  const res = resolveUnique("João", twins);
  assert.equal(res.status, "unique"); // basename is unique here
  const res2 = resolveUnique("João", [
    { basename: "a", name: "João" },
    { basename: "b", name: "João" },
  ]);
  assert.equal(res2.status, "ambiguous");
});

test("non-text stage or kind values are rejected, not treated as empty", () => {
  const opp = validateFrontmatter("crm/opportunity", { type: "crm/opportunity", crm_id: "o", name: "D", stage: { odd: true } });
  assert.ok(opp.some((x) => x.code === "BAD_ENUM" && x.field === "stage" && x.message.includes('{"odd":true}')));
  const ok = validateFrontmatter("crm/opportunity", { type: "crm/opportunity", crm_id: "o", name: "D", stage: null });
  assert.deepEqual(ok, []);
});
