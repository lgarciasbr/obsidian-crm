# Plan — TS-006

## Objective

Improve relationship creation UX so users can select existing related CRM entities or explicitly create missing related entities during person/opportunity creation.

MVP source of truth:

`MVP.md` (private product contract, outside this repository)

Builds on:

- TS-005 metadata repository and entity-link resolution.

## Scope

Implement a simple, MVP-safe select/create flow for related entities:

### Create person

For the company relationship, allow the user to choose one of:

- existing company from CRM records;
- create new company;
- leave unlinked / plain text fallback.

If existing company is selected:

```yaml
company: "[[Company Name]]"
```

If new company is created:

- create `CRM/Companies/{Company Name}.md`;
- store person company as wikilink to the new company.

### Create opportunity

For company and contact relationships, allow the user to choose one of:

- existing CRM record;
- create new related record;
- leave unlinked / plain text fallback.

If new related record is created:

- company creates a company note;
- contact creates a person note;
- opportunity stores the relationship as wikilink.

## UI Approach

Keep UI simple. No polished autocomplete required.

Acceptable implementation:

- modal field for typed value;
- dropdown/select for existing entities when records exist;
- checkbox/toggle such as `Create if missing` or explicit button/option;
- clear behavior that avoids silent creation.

The user must explicitly choose creation of a missing related record. Do not create related records silently from any typed text.

## Non-Goals

- Full autocomplete polish.
- Fuzzy matching.
- Deduplication engine.
- Bulk migration of old records.
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
Given companies exist in the CRM
When the user creates a person
Then the user can select an existing company
And the person frontmatter links to that company
```

```text
Given the desired company does not exist
When the user creates a person and explicitly chooses to create the company
Then a company record is created
And the person frontmatter links to the new company
```

```text
Given people and companies exist in the CRM
When the user creates an opportunity
Then the user can select existing company and contact records
And the opportunity frontmatter links to those records
```

```text
Given a related company or contact does not exist
When the user explicitly chooses to create it during opportunity creation
Then the missing related record is created
And the opportunity frontmatter links to it
```

```text
Given the user enters a missing related name but does not choose to create/link it
When the record is saved
Then the value remains plain text, not an unresolved wikilink
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
2. Create/reuse an existing company.
3. Create a person selecting the existing company.
4. Confirm person links to existing company.
5. Create a person with a missing company and explicitly choose create.
6. Confirm new company note exists and person links to it.
7. Create/reuse an existing person and company.
8. Create an opportunity selecting existing company/contact.
9. Confirm opportunity links to existing records.
10. Create an opportunity with missing company/contact and explicitly choose create.
11. Confirm missing related records are created and linked.
12. Confirm non-created missing names remain plain text.

Pass condition:

- existing related entities can be selected and linked;
- missing related entities can be explicitly created and linked;
- missing related names are not silently converted to unresolved wikilinks;
- build passes;
- no forbidden behavior is introduced.

Fail condition:

- user cannot select existing related entities;
- missing entities are created silently without explicit choice;
- missing names become unresolved wikilinks;
- created related records are placed outside CRM folders;
- build fails;
- implementation introduces forbidden behavior or non-MVP scope.

## Implementation Contract

- Keep changes scoped to `TS-006`.
- Reuse repository and entity creation helpers.
- Do not add external UI libraries.
- Keep UX simple and explicit.
- Do not implement interaction logging.
- Do not implement dashboard or pipeline behavior.

## Stop Conditions

- select/create UX becomes too complex for the current modal system
- creation behavior risks silent or duplicate records without user intent
- schema decision conflicts with MVP.md
- build_fails_without_clear_fix
- navigator_decision_needed

## Approval Gate

- active checkpoint: `after_plan`
- pending confirmation: `navigator_approval`
- implementation remains blocked until Navigator approval.
