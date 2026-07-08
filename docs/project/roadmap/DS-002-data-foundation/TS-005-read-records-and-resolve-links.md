[< Parent](index.md)

# TS-005 — Read CRM Records and Resolve Entity Links

**Status:** 🟡 Planned
**Type:** Technical Story

---

## MVP Source

Derived from `MVP.md` sections:

- Entidades
- APIs do Obsidian a usar
- Restrições técnicas
- Critérios de aceite técnicos CA5, CA6, CA10
- Plano de implementação / Fase 1 — Data foundation

Also addresses deferred debt from TS-004:

- avoid dangling entity wikilinks that create root-level notes when clicked;
- relationship fields should resolve to existing CRM records, offer creation, or avoid unresolved links.

## Technical Story

In order to safely relate CRM records and prepare future dashboards,
As the plugin data layer,
I want to read CRM records from Obsidian metadata and resolve entity links,
So that creation commands can reference existing CRM-managed records instead of generating dangling root-level wikilinks.

## Outcome

The plugin can discover CRM records from Markdown/frontmatter and use that knowledge to resolve person/company references during entity creation.

## Acceptance Behavior

```text
Given CRM entity files exist under the configured CRM root
When the repository reads vault metadata
Then it can list people, companies, and opportunities by type and path
```

```text
Given a user creates a person and selects/types an existing company
When the person file is created
Then the company field links to the existing CRM company note path/name rather than creating a root-level dangling note
```

```text
Given a user enters a related entity that does not exist
When the record is created
Then the plugin avoids silently creating an unresolved wikilink that opens a root-level note
```

## Scope

- Add metadata-based CRM repository for existing entity records.
- Read records by frontmatter `type` from Markdown files under configured CRM root.
- Add entity resolution helper for person/company/opportunity relationship fields.
- Update creation commands to use resolved links when possible.
- Avoid unresolved wikilinks for missing related entities.
- Preserve existing creation behavior otherwise.

## Out Of Scope

- Full autocomplete UI.
- Bulk migration of existing bad links.
- Interaction logging.
- Real dashboard behavior.
- Pipeline behavior.
- Follow-up tasks.
- IA, network, telemetry, backend, login, sync, or external integrations.

## Validation

- Build passes.
- Manual test confirms existing CRM records can be referenced without creating root-level dangling notes.
- Manual test confirms missing related names do not become unresolved wikilinks.
- Source/config scan confirms no forbidden behavior was introduced.
