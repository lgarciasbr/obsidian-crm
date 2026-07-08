# Plan — TS-003

## Objective

Add MVP-scoped commands to create the three base CRM entity records as Markdown files with predictable frontmatter: person, company, and opportunity.

MVP source of truth:

`MVP.md` (private product contract, outside this repository)

Relevant MVP sections:

- Entidades / Pessoa
- Entidades / Empresa
- Entidades / Oportunidade
- Comandos / Create person
- Comandos / Create company
- Comandos / Create opportunity
- APIs do Obsidian a usar
- Restrições técnicas
- Critérios de aceite técnicos CA4, CA6, CA10

## Scope

Implement three creation commands:

- `Create person`
- `Create company`
- `Create opportunity`

Each command should:

- collect only minimal required fields through simple Obsidian modals;
- ensure CRM folders exist before writing;
- create one Markdown file under the configured CRM root;
- write MVP-compatible frontmatter;
- include a simple Markdown body heading;
- open the created file after creation when practical;
- handle filename collisions by adding a numeric suffix.

Target default paths:

```text
CRM/People/{Name}.md
CRM/Companies/{Name}.md
CRM/Opportunities/{Company} - {Opportunity}.md
```

Minimum required input:

- person: name;
- company: name;
- opportunity: opportunity name and company text/link.

Frontmatter must include at least:

- person: `type: crm/person`, `crm_id`, `name`, `status`, `tags`;
- company: `type: crm/company`, `crm_id`, `name`, `status`, `tags`;
- opportunity: `type: crm/opportunity`, `crm_id`, `name`, `company`, `stage`, `status`, `created`, `tags`.

## Non-Goals

- Interaction logging.
- Updating related records.
- Metadata repository/listing behavior beyond simple filename collision checks.
- Real dashboard behavior.
- Pipeline behavior.
- Follow-up task generation.
- Dataview integration beyond Markdown/frontmatter compatibility.
- IA features.
- Network calls.
- Telemetry or analytics.
- Backend, login, sync, or external integrations.

## Acceptance Behavior

```text
Given the plugin is enabled and CRM folders exist
When the user runs Create person and provides a name
Then a Markdown file is created under CRM/People
And the file contains type crm/person frontmatter
```

```text
Given the plugin is enabled and CRM folders exist
When the user runs Create company and provides a name
Then a Markdown file is created under CRM/Companies
And the file contains type crm/company frontmatter
```

```text
Given the plugin is enabled and CRM folders exist
When the user runs Create opportunity and provides an opportunity name and company
Then a Markdown file is created under CRM/Opportunities
And the file contains type crm/opportunity frontmatter
```

```text
Given a target filename already exists
When the user creates another record with the same base name
Then the plugin creates a non-destructive suffixed filename instead of overwriting the existing file
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

- deploy plugin artifacts to the test vault;
- run `Initialize CRM folders` if needed;
- run `Create person` and create one test person;
- run `Create company` and create one test company;
- run `Create opportunity` and create one test opportunity;
- confirm the created Markdown files exist in the correct folders with expected frontmatter.

Pass condition:

- all three record types are created as Markdown files under the configured root;
- frontmatter uses the expected MVP `type` values;
- existing files are not overwritten;
- build passes;
- no forbidden behavior is introduced.

Fail condition:

- files are missing;
- files are created outside the configured root;
- frontmatter is absent or uses wrong `type` values;
- existing files are overwritten;
- build fails;
- implementation introduces forbidden behavior or non-MVP scope.

## Implementation Contract

- Keep changes scoped to `TS-003`.
- Use Obsidian vault APIs for file creation.
- Do not use Node filesystem APIs.
- Do not implement repository/listing abstractions beyond what is needed for this story.
- Do not update related records yet.
- Keep UI simple; polish belongs later.

## Stop Conditions

- scope_change_detected
- modal design expands beyond MVP fields
- entity creation requires non-Obsidian filesystem API
- schema decision conflicts with MVP.md
- build_fails_without_clear_fix
- navigator_decision_needed

## Approval Gate

- active checkpoint: `after_plan`
- pending confirmation: `navigator_approval`
- implementation remains blocked until Navigator approval.
