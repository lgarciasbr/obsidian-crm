[< Story](index.md)

# Test Guide — TS-003

## Automated / Local Validation

Run from repository root:

```bash
npm run build
```

Inspect source/config for forbidden behavior:

```bash
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(" main.ts manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
```

Expected result:

- build passes;
- scan returns no matches for intentional network, telemetry, IA SDK, backend client, Node filesystem, process-spawning behavior, or absolute-path coupling.

## E2E Decision

Manual Obsidian validation is required for TS-003.

Reason: this story creates real Markdown files in the vault, so the Navigator must confirm the actual files and frontmatter.

## Navigator Validation

Manual route:

1. Build and deploy plugin artifacts to the test vault.
2. Open/reload Obsidian test vault:

```text
<TestVault>
```

3. Run command `Initialize CRM folders` if needed.
4. Run command `Create person` and create a test person.
5. Run command `Create company` and create a test company.
6. Run command `Create opportunity` and create a test opportunity.
7. Confirm files exist under:

```text
CRM/People/
CRM/Companies/
CRM/Opportunities/
```

8. Confirm each file has the expected frontmatter `type`:

```text
crm/person
crm/company
crm/opportunity
```

Expected observation:

- one person file, one company file, and one opportunity file exist under the configured CRM root;
- files are Markdown and readable without the plugin;
- frontmatter follows MVP type values.

Pass condition:

- all three entity files exist in expected folders;
- frontmatter is present and uses expected `type` values;
- existing files are not overwritten.

Fail condition:

- any entity file is missing;
- file is created outside configured root;
- frontmatter is missing or wrong;
- plugin overwrites an existing file unexpectedly;
- plugin errors during creation.

## Validation Evidence

Implementation evidence captured on 2026-07-04:

- `npm run build` completed successfully.
- Source/config forbidden-behavior scan returned no matches.
- Updated plugin artifacts were copied to the test vault plugin folder.

Manual Obsidian validation remains pending Navigator confirmation:

- reload/enable Relationship CRM in the test vault;
- run `Create person`;
- run `Create company`;
- run `Create opportunity`;
- confirm files exist under `CRM/People`, `CRM/Companies`, and `CRM/Opportunities` with expected `type` frontmatter.
