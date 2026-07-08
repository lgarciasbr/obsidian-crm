# Plan — TS-012

## Objective

Polish the CRM creation/capture modals so they feel like lightweight Obsidian quick-capture flows instead of raw admin forms.

## Scope

Improve existing modals only:

- `Create person`;
- `Create company`;
- `Create opportunity`;
- `Log interaction`.

Changes:

- translate modal titles, labels, placeholders, validation messages, and submit buttons to PT-BR;
- use action-specific submit button text:
  - `Criar pessoa`;
  - `Criar empresa`;
  - `Criar oportunidade`;
  - `Registrar interação`;
- allow CRM modals to use a wider, more comfortable layout where useful;
- add optional section headings/dividers in the shared modal component;
- group `Log interaction` into:
  - `Relação`;
  - `Interação`;
  - `Próximo passo`;
- improve existing/create-new copy:
  - `Selecionar existente`;
  - `Ou criar novo`;
- keep the current UX decision: select existing first, create new below;
- keep data model and creation behavior unchanged.

## Non-Goals

- Replace modals with full pages or side panels.
- Add new CRM fields outside current MVP.
- Change pipeline behavior.
- Change dashboard behavior.
- Change follow-up/task resolution logic.
- Add IA, network, telemetry, backend, login, sync, or external integrations.

## Acceptance Behavior

```text
Given the user opens Create person/company/opportunity
When the modal renders
Then title, labels, placeholders, validation messages, and primary button are in Portuguese
```

```text
Given the user opens Log interaction
When the modal renders
Then fields are grouped into Relação, Interação, and Próximo passo
```

```text
Given a field supports an existing related record and a new related record
When the modal renders
Then the existing dropdown and new-record input have clear PT-BR copy without adding a toggle
```

```text
Given the user submits each modal with valid data
When the command completes
Then the same CRM notes/frontmatter are created or updated as before TS-012
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
2. Open each command:
   - `Create person`;
   - `Create company`;
   - `Create opportunity`;
   - `Log interaction`.
3. Confirm copy/layout is more comfortable and PT-BR.
4. Submit each modal with valid test data.
5. Confirm notes/frontmatter are still created correctly.
6. Confirm `Log interaction` still updates related records and generates follow-up task when applicable.

Pass condition:

- all modals remain functional;
- modals are localized and action-specific;
- `Log interaction` is grouped and easier to scan;
- existing select/create-new behavior remains intact;
- build passes;
- no forbidden behavior is introduced.

Fail condition:

- modal submission breaks;
- required validation breaks;
- existing/new related record behavior regresses;
- Log interaction no longer creates interaction/update/task correctly;
- build fails;
- forbidden behavior or non-MVP scope is introduced.

## Implementation Contract

- Keep changes scoped to shared modal UI and command field definitions.
- Preserve current field keys and creation behavior.
- Prefer CSS class additions over custom per-modal DOM hacks.
- Do not alter storage schema.
- Do not implement new commands.

## Stop Conditions

- modal polish requires redesigning the entire capture flow;
- field grouping threatens existing submit behavior;
- navigator_decision_needed.

## Approval Gate

- active checkpoint: `after_plan`
- pending confirmation: `navigator_approval`
- implementation remains blocked until Navigator approval.
