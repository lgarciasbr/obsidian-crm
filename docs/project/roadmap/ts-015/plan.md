# Plan — TS-015

## Objective

Fix immediate fresh-vault UX defects before deeper Markdown relationship sync.

## Scope

1. **Pipeline creation should keep the user in the pipeline**
   - When a person/company/opportunity is created from a pipeline toolbar/card/column action, do not open the created `.md` note.
   - Refresh/re-render the pipeline when relevant.
   - Direct command-palette creation may continue to open the created note.

2. **Currency formatting default should be Brazilian for MVP**
   - Display BRL as `R$ 8.000,00`, not `R$8,000.00`.
   - Prefer explicit `pt-BR`/`BRL` defaults for now.
   - Do not add full settings UI in this story unless trivial.

3. **Empty related-record dropdowns should not show misleading suggestions**
   - If no existing people/companies/opportunities exist, avoid showing a fake/suggested dropdown value.
   - Keep the existing pattern: select existing first, create new below.
   - If there are no existing records, make the empty state obvious and let the user create new.

## Non-Goals

- Markdown body relationship sync.
- Updating company body sections like `## Pessoas` and `## Oportunidades`.
- Rename/delete consistency for CRM entity files.
- Full localization settings.
- Full currency/locale settings UI.
- Hardening/release documentation.
- Network, telemetry, IA, backend, login, sync, or external integrations.

## Acceptance Behavior

```text
Given the user creates an opportunity from a pipeline column
When the opportunity is created
Then the pipeline remains open and the new card appears in the selected stage
```

```text
Given a BRL opportunity value is shown in the pipeline
When the card renders
Then the value is formatted as Brazilian currency, e.g. R$ 8.000,00
```

```text
Given no companies exist
When a modal with company selection opens
Then the dropdown does not show a misleading fake option as data
And the create-new input remains available
```

```text
Given records exist
When a related-record field opens
Then existing records appear in the dropdown as before
```

## Validation Route

- `npm run build`
- forbidden-behavior scan
- deploy to test vault
- manual fresh-vault validation:
  1. create CRM from scratch;
  2. open pipeline;
  3. create company/person from pipeline top actions and confirm pipeline remains open;
  4. create opportunity from a stage and confirm pipeline remains open and card appears;
  5. confirm BRL formatting is Brazilian;
  6. confirm empty dropdown state does not show fake records;
  7. confirm existing records appear once created.

## Approval Gate

Implementation blocked until Navigator approval.
