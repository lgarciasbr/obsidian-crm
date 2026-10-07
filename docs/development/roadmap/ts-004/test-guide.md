[< Story](index.md)

# Test Guide — TS-004

## Automated / Local Validation

Run from repository root:

```bash
npm run build
```

Inspect source/config for forbidden behavior:

```bash
rg "fetch|XMLHttpRequest|analytics|telemetry|openai|anthropic|gemini|fs\b|child_process|exec\(|spawn\(" main.ts src manifest.json package.json tsconfig.json esbuild.config.mjs styles.css versions.json
```

Expected result:

- build passes;
- scan returns no matches for intentional network, telemetry, IA SDK, backend client, Node filesystem, process-spawning behavior, or absolute-path coupling.

## E2E Decision

Manual Obsidian validation is required for TS-004.

Reason: this is a behavior-preserving refactor. The same commands validated in TS-003 must still work in the test vault.

## Navigator Validation

Manual route:

1. Build and deploy plugin artifacts to the test vault.
2. Open/reload Obsidian test vault:

```text
<TestVault>
```

3. Run command `Initialize CRM folders`.
4. Run command `Create person`.
5. Run command `Create company`.
6. Run command `Create opportunity`.
7. Confirm files still appear in the expected CRM folders with expected frontmatter.

Expected observation:

- behavior is unchanged from TS-003;
- `main.ts` is now orchestration-only compared with the previous mixed-responsibility version.

Pass condition:

- existing commands still work;
- entity files are created correctly;
- build passes;
- no forbidden behavior is introduced.

Fail condition:

- any existing command disappears or breaks;
- entity files are created incorrectly;
- build fails;
- refactor introduces forbidden behavior.

## Validation Evidence

Implementation evidence captured on 2026-07-04:

- `npm run build` completed successfully.
- Source/config forbidden-behavior scan returned no matches.
- Updated plugin artifacts were copied to the test vault plugin folder.

Manual Obsidian validation remains pending Navigator confirmation.
