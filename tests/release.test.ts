import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";

// Obsidian and BRAT install the GitHub release whose tag equals the manifest
// version, so the version files must agree before a tag is pushed.
const root = join(__dirname, "..", "..");
const read = (file: string) => JSON.parse(readFileSync(join(root, file), "utf8"));

test("manifest, package and versions.json agree on the release version", () => {
  const manifest = read("manifest.json");
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/, "Obsidian only accepts x.y.z versions");
  assert.equal(read("package.json").version, manifest.version);
  assert.equal(read("versions.json")[manifest.version], manifest.minAppVersion);
});

test("the minimum Obsidian version supports FileManager.trashFile", () => {
  const actual = read("manifest.json").minAppVersion.split(".").map(Number);
  const required = [1, 6, 6];
  const different = actual.findIndex((value: number, index: number) => value !== required[index]);
  assert.ok(different === -1 || actual[different] > required[different], "trashFile requires Obsidian 1.6.6 or later");
});

test("the manifest satisfies the community directory rules", () => {
  const manifest = read("manifest.json");
  assert.doesNotMatch(manifest.id, /obsidian/i);
  assert.doesNotMatch(manifest.description, /obsidian/i);
});

test("the changelog has notes for the manifest version", () => {
  const { version } = read("manifest.json");
  const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
  const section = changelog.split(/^## /m).find((part) => part.startsWith(`[${version}]`));
  assert.ok(section, `CHANGELOG.md needs a "## [${version}]" section`);
  assert.ok(section.split("\n").slice(1).join("\n").trim().length > 0, "the section must not be empty");
});
