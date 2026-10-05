[< Roadmap](roadmap/index.md)

# Relationship CRM — Data Contract (v0.1)

This is the source-of-truth contract for CRM records. Every writer — the visual
UI **and** a human editing Markdown by hand — must produce records that satisfy
this contract. The Attention Dashboard and any other value surface are only
allowed to assume what this contract guarantees.

If a record violates this contract, it is a bug in the writer or a drift in a
hand-edited file, not something a surface should try to "guess around".

## 1. Principles

- **Markdown/frontmatter is the only source of truth.** No sidecar DB, no cache
  as truth. If the plugin is uninstalled, the records remain valid and readable.
- **Every field has a defined type and a defined set of valid values.**
- **Integrity rules are enforced in pure functions** (`src/crm/integrity.ts`) so
  they can be tested without Obsidian and reused by every writer.
- **Never destroy user state as a side effect.** Logging an interaction must not
  silently erase a pending follow-up or roll back the last contact date.

## 2. Entities

Four record types, identified by the `type` frontmatter key:

| type              | folder           | basename convention        |
|-------------------|------------------|----------------------------|
| `crm/person`      | `People/`        | `Name`                     |
| `crm/company`     | `Companies/`     | `Name`                     |
| `crm/opportunity` | `Opportunities/` | `Company - Name`           |
| `crm/interaction` | `Interactions/`  | `YYYY-MM-DD - kind - Target`|

## 3. Identity and links

- Every record carries a stable `crm_id` (`<prefix>-<slug>`), generated once at
  creation. `crm_id` is the **stable identity** and must never change on rename.
- Relationship links are stored as Obsidian wikilinks to the **basename**:
  `company: "[[Acme]]"`, `contact: "[[Maria Souza]]"`.
- **Basename uniqueness rule:** within a given `type`, no two CRM records may
  share a basename. If they do, links become ambiguous. The validator flags this
  as `DUPLICATE_BASENAME`. Writers must not silently resolve an ambiguous name to
  "the first match".
- Link resolution: a name resolves to a record only when it matches exactly one
  record of the target type (by basename, then by `name`). Zero matches → keep as
  plain text. More than one match → ambiguous, must be surfaced, not guessed.

## 4. Field schema

### Common
- `type` (required, one of the four values)
- `crm_id` (required, non-empty)
- `name` (required for person/company/opportunity; interactions have no `name`
  field — their identity is `crm_id` + basename `YYYY-MM-DD - kind - target`)
- Optional enum fields serialize as `null` when left empty in YAML; an empty/null
  optional enum is treated as "not set", never as an invalid value.
- `tags` (list, must include the matching `crm/*` tag)
- `last_contact` (ISO date `YYYY-MM-DD` or empty)
- `next_action` (string or empty)
- `next_action_date` (ISO date `YYYY-MM-DD` or empty)

### crm/person
- `company` (wikilink or empty), `role`, `email`, `phone`, `linkedin`

### crm/company
- `site`, `industry`

### crm/opportunity
- `company` (wikilink, required), `contact` (wikilink or empty)
- `stage` ∈ configured pipeline stages (default:
  `lead, conversation, proposal, negotiation, won, lost, paused`)
- `value` (numeric string or empty), `created` (ISO date), `notes` (free text)

> Removed in v0.1: `relationship_temperature`, `status`, `currency`. They were
> written but never transitioned or exposed in any control (dead fields). They
> will be reintroduced only when a feature actually reads/writes them (e.g.
> cooling logic, won/lost transitions, multi-currency). The validator still
> tolerates them if present on legacy records but no writer emits them.

### crm/interaction
- `date` (ISO date, required)
- `kind` ∈ {`call`, `meeting`, `email`, `whatsapp`, `linkedin`, `note`, `other`}
  (until 2026-10-05 the pt-BR values `ligação`, `reunião`, `nota`, `outro` were used; they are now flagged as `BAD_ENUM`)
- `people` (list of wikilinks), `company` (wikilink or empty),
  `opportunity` (wikilink or empty)
- `outcome`, `next_action`, `next_action_date`

## 5. Integrity rules (enforced, testable)

- **R1 — last_contact never rolls back.**
  When an interaction updates a related record, the new `last_contact` is
  `max(existing, interaction.date)`. Logging an older interaction must not
  overwrite a more recent contact date.

- **R2 — next_action is never silently wiped.**
  When an interaction has an empty `next_action`, the related record keeps its
  existing `next_action` / `next_action_date`. Only a non-empty interaction
  next_action replaces the record's pending action.

- **R3 — valid enumerations.** `stage`, `status`, `kind`,
  `relationship_temperature` must be within their allowed sets.

- **R4 — ISO dates.** `date`, `last_contact`, `next_action_date`, `created` are
  either empty or strict `YYYY-MM-DD`.

- **R5 — required fields present** per the schema in §4.

- **R6 — basename uniqueness** per type (§3).

- **R7 — backlink symmetry (target state).** A relationship rendered in one
  record's body should be discoverable from the other side. v0.1 minimum:
  person→company, opportunity→company, and interaction→(person, company,
  opportunity). Missing symmetric backlinks are reported as `ASYMMETRIC_LINK`
  warnings (non-blocking for v0.1).

## 6. What surfaces may assume

The Attention Dashboard may assume:

- a record with `status: open` (opportunity) or `status: active`
  (person/company) and a valid `next_action_date` belongs to Today / Overdue /
  Next-7 buckets purely by date math;
- a record with no `next_action` and open/active status is a "No next action";
- `last_contact` is monotonic (never rolled back), so "Cooling" is
  `today - last_contact > coolingThresholdDays`.

If the dashboard shows nonsense, first run the validator over the vault; a
contract violation upstream is the more likely cause than a dashboard bug.
