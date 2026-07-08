[< Parent](index.md)

# TS-003 — Create Person/Company/Opportunity Records

**Status:** 🟡 Planned
**Type:** Technical Story

---

## MVP Source

Derived from `MVP.md` sections:

- Entidades / Pessoa
- Entidades / Empresa
- Entidades / Oportunidade
- Comandos / Create person
- Comandos / Create company
- Comandos / Create opportunity
- APIs do Obsidian a usar
- Restrições técnicas
- Critérios de aceite técnicos CA4, CA6, CA10

## Technical Story

In order to start capturing CRM data inside Obsidian,
As the plugin foundation,
I want commands that create person, company, and opportunity Markdown records,
So that future interaction and dashboard stories can operate on MVP-compatible frontmatter.

## Outcome

The plugin can create base CRM entity notes under the configured CRM root using MVP frontmatter schemas.

## Acceptance Behavior

```text
Given the plugin is enabled and CRM folders exist
When the user runs Create person with required input
Then a Markdown file is created under CRM/People with type crm/person frontmatter
```

```text
Given the plugin is enabled and CRM folders exist
When the user runs Create company with required input
Then a Markdown file is created under CRM/Companies with type crm/company frontmatter
```

```text
Given the plugin is enabled and CRM folders exist
When the user runs Create opportunity with required input
Then a Markdown file is created under CRM/Opportunities with type crm/opportunity frontmatter
```

## Scope

- Add create person command.
- Add create company command.
- Add create opportunity command.
- Use simple Obsidian modals/prompts or minimal UI to collect required fields.
- Generate MVP-compatible Markdown/frontmatter.
- Ensure CRM folders before writing files.
- Handle filename collisions safely.

## Out Of Scope

- Interaction logging.
- Updating related records.
- Reading/listing repository behavior beyond what is necessary to avoid obvious filename collisions.
- Real dashboard behavior.
- Pipeline behavior.
- Follow-up task generation.
- IA, network, telemetry, backend, login, sync, or external integrations.

## Validation

- Build passes.
- Manual test in the test vault creates one person, one company, and one opportunity.
- Created files contain expected frontmatter and remain readable Markdown.
- Source/config scan confirms no forbidden behavior was introduced.
