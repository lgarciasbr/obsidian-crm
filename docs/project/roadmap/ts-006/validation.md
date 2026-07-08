# Validation — TS-006

## Status

Passed

## Automated Checks

- npm run build; forbidden source/config scan; deploy artifacts to test vault

Checks status: passed

## E2E

Decision: required

Evidence: Navigator validated in the test vault that related entities are selected from lists or created through explicit create-new fields; creating a person links it to either an existing or newly created company.

## Navigator Validation

Route: Manual Obsidian validation in test-crm-vault for select/create related entity flows.

Navigator accepted: yes

Expected observation: Existing related entities can be selected; missing related entities can be explicitly created and linked; person creation connects to the selected or new company.

Pass condition: Select/create relationship flows work and no unresolved root-level wikilinks are created.

Fail condition: Existing related entities cannot be selected, missing entities are created silently, missing names become unresolved wikilinks, or plugin errors.

## Missing Evidence

- none
