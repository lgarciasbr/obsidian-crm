[< Parent](index.md)

# TS-006 — Select or Create Related Entities

**Status:** 🟡 Planned
**Type:** Technical Story

---

## MVP Source

Derived from these sections of the private MVP contract (`MVP.md`):

- Entities
- Commands / Create person
- Commands / Create opportunity
- Obsidian APIs to use
- Technical constraints

Builds on TS-005 entity repository and link resolution.

## Technical Story

In order to prevent weak relationship data at creation time,
As a solo professional using the CRM,
I want to select existing related entities or create them when missing,
So that person/company/opportunity relationships are stored as valid CRM-managed links.

## Outcome

Create person and create opportunity flows guide the user toward existing CRM records or explicit creation of missing related records instead of relying on ambiguous free text.

## Acceptance Behavior

```text
Given companies exist in the CRM
When the user creates a person
Then the company field allows choosing an existing company
```

```text
Given the desired company does not exist
When the user creates a person
Then the user can create a new company as part of the flow
And the person links to that new company record
```

```text
Given people and companies exist in the CRM
When the user creates an opportunity
Then the company and contact fields allow choosing existing records
```

```text
Given a related company or contact does not exist
When the user creates an opportunity
Then the user can create the missing related record before saving the opportunity
```

## Scope

- Add simple select/create UI for company on Create person.
- Add simple select/create UI for company and contact on Create opportunity.
- Reuse repository lookups from TS-005.
- Create related company/person records when the user explicitly chooses create.
- Store relationship fields as wikilinks when related records exist or are created.
- Preserve plain text fallback only when the user intentionally chooses not to create/link.

## Out Of Scope

- Full autocomplete polish.
- Bulk deduplication.
- Existing data migration.
- Interaction logging.
- Dashboard behavior.
- Pipeline behavior.
- IA, network, telemetry, backend, login, sync, or external integrations.

## Validation

- Build passes.
- Manual validation confirms selecting existing related entities works.
- Manual validation confirms creating missing related entities works.
- No root-level dangling notes are created by relationship fields.
- Source/config scan confirms no forbidden behavior was introduced.
