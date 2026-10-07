# Plan — TS-016

## Objective

Make generated CRM Markdown bodies coherent with the relationships already stored in frontmatter.

## Problem

Fresh-vault validation showed that company notes contain sections like `## Pessoas` and `## Oportunidades`, but those sections remain empty even after creating related people/opportunities. That makes the `.md` files feel broken and less useful as Obsidian documents.

## Scope

Implement forward relationship sync for newly created/updated records:

1. **Company note body**
   - When creating a person linked to a company, add the person link under company `## Pessoas`.
   - When creating an opportunity linked to a company, add the opportunity link under company `## Oportunidades`.

2. **Opportunity note body**
   - Include linked company and contact sections in the generated body when available.
   - Keep manual sections below.

3. **Interaction logging**
   - When logging an interaction, add the interaction link under `## Histórico` in related person/company/opportunity notes when those records exist.

4. **Safe Markdown section update helper**
   - Add links under known headings without duplicating links.
   - Create the section if missing.
   - Preserve existing user-written content as much as practical.

## Non-Goals

- Full backfill of old vaults.
- Entity rename/delete consistency.
- Bidirectional repair command.
- Removing broken links.
- Complex Markdown AST parsing.
- Rewriting arbitrary user sections.
- Network, telemetry, IA, backend, login, sync, or external integrations.

## Acceptance Behavior

```text
Given company Acme exists
When the user creates person Maria linked to Acme
Then Acme.md contains - [[Maria]] under ## Pessoas
```

```text
Given company Acme exists
When the user creates opportunity Diagnóstico linked to Acme
Then Acme.md contains the opportunity link under ## Oportunidades
```

```text
Given a person/company/opportunity exists
When the user logs an interaction linked to them
Then each related note contains the interaction link under ## Histórico
```

```text
Given a link already exists in a section
When the same relationship is processed again
Then the link is not duplicated
```

## Validation Route

- `npm run build`
- forbidden-behavior scan
- deploy to test vault
- manual validation in fresh vault:
  1. create company;
  2. create person linked to company;
  3. confirm company `## Pessoas` has person link;
  4. create opportunity linked to company/person;
  5. confirm company `## Oportunidades` has opportunity link;
  6. confirm opportunity body links company/contact;
  7. log interaction linked to all three;
  8. confirm related notes have interaction link in `## Histórico`;
  9. repeat action and confirm no duplicate links.

## Approval Gate

Implementation blocked until Navigator approval.
