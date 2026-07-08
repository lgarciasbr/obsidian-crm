# Validation — TS-014

## Status

Blocked

## Automated Checks

- npm run build; dashboard reference scan; forbidden source/config scan; deploy artifacts to test vault

Checks status: passed

## E2E

Decision: required

Evidence: Manual Obsidian validation not yet performed; dashboard code/command/styles were removed and Set next action was implemented and deployed to the test vault.

## Navigator Validation

Route: Reload Relationship CRM. Confirm Open CRM dashboard is gone. Run Set next action on person, company, and opportunity notes; confirm frontmatter updates and task append. Run it on non-CRM note and confirm notice/no mutation.

Navigator accepted: no

Expected observation: Rejected dashboard command is absent and Set next action updates supported CRM entity notes.

Pass condition: Dashboard is removed, Set next action works on supported entity notes, unsupported note is protected, build passes, and no forbidden behavior appears.

Fail condition: Dashboard still appears, Set next action fails or mutates unsupported notes, task/frontmatter is wrong, build fails, or forbidden behavior appears.

## Missing Evidence

- Navigator validation has not been accepted
