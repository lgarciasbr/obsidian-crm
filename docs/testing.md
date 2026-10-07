# Manual test script

Run this before every release, in a **test vault with made-up data** (never real contacts), on desktop and, when possible, on a phone. Automated tests cover the rules and the note-writing flows; this script covers what only Obsidian can show: the view, modals, drag and drop and the phone layout.

Mark each step ✅ or ❌ and note the plugin version, Obsidian version and platform.

## 1. Install and set up

1. Install the release (BRAT: *Check for updates*; or copy `main.js`, `manifest.json`, `styles.css`). Reload the plugin.
2. In **Settings → CRM**, set **Root folder** to a new folder name and close the settings. → Any open CRM view closes with a notice.
3. Run **CRM: Open**. → The folder is created with `People`, `Companies`, `Opportunities`, `Interactions`, `Pipeline.md`, `AGENTS.md` and `CLAUDE.md`, and the board opens.

## 2. Records and links

4. **CRM: Create opportunity** with a *new* company and a *new* contact; press **Enter** to submit. → One opportunity, one company and one person are created (double-check nothing is duplicated).
5. Open the three notes. → The opportunity's `## Company` and `## Contact` show `[[links]]`; the company lists the person under `## People` and the opportunity under `## Opportunities`; the person has `company: "[[…]]"` and lists the opportunity.
6. From the card, click **Log interaction** (speech-bubble icon), add a next action and a date. → The interaction note has a task line; the person, company and opportunity show it under `## History` and have the next action set.
7. **Edit** the opportunity and choose a *new* company. → The file is renamed `NewCompany - Name`, the `## Company` section changes, the old company no longer lists it and the new one does.
8. On a person note, run **CRM: Set next action** twice with different actions. → Only one `## Next action` heading, with both tasks.
9. **Delete** the opportunity from the card menu. → It goes to the trash; the company and contact no longer list it.

## 3. Board

10. Drag a card above and below another card in the same column, then into another column. → A line shows where it will drop; the order sticks after closing and reopening the CRM.
11. Use the card menu: **Move up**, **Move down**, **Move to <stage>**. → Same results as dragging.
12. Create a stage with a capital letter (for example "Qualified"), rename it, reorder columns, collapse one, then delete an empty stage. → All persist after reopening; deleting a stage with cards is refused.
13. Give an opportunity a long title. → The title wraps; the card icons stay in the top-right corner.
14. Run **CRM: Validate data**. → `Validation Report.md` shows no violations.

## 4. Lists

15. **Companies** and **Contacts** tabs: search, open a record, create one from the button. → Counts of people and opportunities per company are right.
16. Set a company's `site` to `acme.example` and click it. → It opens `https://acme.example/` in the browser. Set it to `javascript:alert(1)`. → It shows as plain text and does not open.

## 5. Phone (iOS/Android)

17. Open the CRM. → One column fills most of the screen and swipes snap column by column.
18. Use **Move up / Move down / Move to** from the card menu. → Cards move (dragging may not work on touch screens; that is expected).
19. Open **Create opportunity**. → Fields are stacked and readable; nothing overflows horizontally.
20. Companies/Contacts tabs. → The search field takes the full width.
