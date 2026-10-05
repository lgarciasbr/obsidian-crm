[< Parent](../index.md)

# TS-003 — Create Person/Company/Opportunity Records

**Status:** 🟩 Done
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

Source file:

`MVP.md` (private product contract, outside this repository)

## Outcome

The plugin can create person, company, and opportunity Markdown records under the configured CRM root with MVP-compatible frontmatter.

## Story Statement

In order to start capturing CRM data inside Obsidian,
As the plugin foundation,
I want commands that create person, company, and opportunity Markdown records,
So that future interaction and dashboard stories can operate on MVP-compatible frontmatter.

## Acceptance Behavior

```text
Given the plugin is enabled and CRM folders exist
When the user runs Create person with a name
Then a Markdown file is created under CRM/People with type crm/person frontmatter
```

```text
Given the plugin is enabled and CRM folders exist
When the user runs Create company with a name
Then a Markdown file is created under CRM/Companies with type crm/company frontmatter
```

```text
Given the plugin is enabled and CRM folders exist
When the user runs Create opportunity with opportunity name and company
Then a Markdown file is created under CRM/Opportunities with type crm/opportunity frontmatter
```

## Scope

- Add create person command.
- Add create company command.
- Add create opportunity command.
- Use simple Obsidian modals to collect required fields.
- Generate MVP-compatible Markdown/frontmatter.
- Ensure CRM folders before writing files.
- Handle filename collisions safely.

## Out Of Scope

- Interaction logging.
- Updating related records.
- Real dashboard behavior.
- Pipeline behavior.
- Follow-up task generation.
- IA, network, telemetry, backend, login, sync, or external integrations.

## Validation

- Run `npm run build`.
- Deploy to test vault.
- Create one person, one company, and one opportunity.
- Confirm files exist in expected folders with expected frontmatter.
- Inspect source/config for forbidden behavior.

---

## Artifacts

- [Plan](plan.md)
- [Test Guide](test-guide.md)
