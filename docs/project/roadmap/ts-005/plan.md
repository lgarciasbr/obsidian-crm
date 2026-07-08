# Plan — TS-005

## Objective

Add metadata-based CRM record reading and entity-link resolution so relationship fields stop creating unresolved root-level notes in Obsidian.

MVP source of truth:

`MVP.md` (private product contract, outside this repository)

Relevant MVP sections:

- Entidades
- APIs do Obsidian a usar
- Restrições técnicas
- Critérios de aceite técnicos CA5, CA6, CA10
- Plano de implementação / Fase 1 — Data foundation

Deferred debt addressed:

- avoid dangling entity wikilinks that create root-level notes when clicked.

## Scope

Implement a focused data foundation slice:

- add CRM repository module that reads Markdown files under configured `crmRoot`;
- use `app.metadataCache.getFileCache(file)?.frontmatter` where possible;
- identify CRM records by frontmatter `type`:
  - `crm/person`
  - `crm/company`
  - `crm/opportunity`
- expose lookup by entity type and name;
- add entity-link resolver for relationship fields;
- update create commands so related fields link only when a matching CRM record exists;
- when a related name does not exist, store plain text instead of unresolved `[[wikilink]]`;
- preserve existing entity creation behavior otherwise.

Resolution rules for this story:

```text
If related entity exists:
  store a wikilink to the existing CRM note basename.

If related entity does not exist:
  store plain text, not a wikilink.
```

Examples:

```yaml
company: "[[Acme]]"   # if CRM/Companies/Acme.md exists
company: "Acme"       # if no matching company exists
```

This is intentionally simpler than autocomplete or automatic creation.

## Non-Goals

- Full autocomplete UI.
- Automatic creation of missing related entities.
- Migration of already-created dangling links.
- Interaction logging.
- Real dashboard behavior.
- Pipeline behavior.
- Follow-up tasks.
- IA features.
- Network calls.
- Telemetry or analytics.
- Backend, login, sync, or external integrations.

## Acceptance Behavior

```text
Given CRM entity files exist under the configured CRM root
When the repository reads vault metadata
Then it can list people, companies, and opportunities by type, name, and path
```

```text
Given CRM/Companies/Acme.md exists
When the user creates a person with company Acme
Then the person frontmatter stores company as "[[Acme]]"
```

```text
Given no CRM company named Unknown Co exists
When the user creates a person with company Unknown Co
Then the person frontmatter stores company as "Unknown Co"
And clicking it does not create a root-level Obsidian note
```

```text
Given CRM/People/Maria Souza.md exists
When the user creates an opportunity with contact Maria Souza
Then the opportunity frontmatter stores contact as "[[Maria Souza]]"
```

```text
Given no CRM person named New Contact exists
When the user creates an opportunity with contact New Contact
Then the opportunity frontmatter stores contact as "New Contact"
And clicking it does not create a root-level Obsidian note
```

## Validation Route

Automated/local checks:

- `npm run build`
- source/config forbidden-behavior scan for:
  - `fetch`
  - `XMLHttpRequest`
  - analytics SDKs
  - IA SDKs
  - backend clients
  - Node `fs`
  - process spawning
  - absolute system paths

Navigator-visible manual route:

1. Deploy plugin artifacts to the test vault.
2. Create or reuse `CRM/Companies/Acme.md`.
3. Create a person with company `Acme`.
4. Confirm person frontmatter uses `company: "[[Acme]]"`.
5. Create a person with company `Unknown Co`.
6. Confirm person frontmatter uses plain text `company: "Unknown Co"`, not `[[Unknown Co]]`.
7. Create or reuse `CRM/People/Maria Souza.md`.
8. Create an opportunity with contact `Maria Souza` and company `Acme`.
9. Confirm existing references are wikilinks and missing references are plain text.

Pass condition:

- repository resolves existing CRM entities;
- missing related entities do not become unresolved wikilinks;
- entity creation still works;
- build passes;
- no forbidden behavior is introduced.

Fail condition:

- existing CRM entities are not resolved;
- missing related names are stored as unresolved wikilinks;
- root-level notes are created by clicking missing related names;
- build fails;
- implementation introduces forbidden behavior or non-MVP scope.

## Implementation Contract

- Keep changes scoped to `TS-005`.
- Use Obsidian metadata and vault APIs.
- Do not use Node filesystem APIs.
- Do not add autocomplete or automatic creation yet.
- Do not migrate existing data.
- Prefer explicit simple rules over clever inference.

## Stop Conditions

- relationship resolution requires UX beyond simple rules
- metadataCache cannot support required lookup without broader repository design
- schema decision conflicts with MVP.md
- build_fails_without_clear_fix
- navigator_decision_needed

## Approval Gate

- active checkpoint: `after_plan`
- pending confirmation: `navigator_approval`
- implementation remains blocked until Navigator approval.
