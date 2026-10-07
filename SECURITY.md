# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report them privately through GitHub: go to the repository's **Security** tab and choose **Report a vulnerability** (or open [this link](https://github.com/lgarciasbr/obsidian-crm/security/advisories/new)). Only the maintainer can see the report. You can expect a first answer within a week; once a fix is released, the advisory is published with credit to you, unless you prefer otherwise.

## Supported versions

Fixes are released for the latest version only. Update through BRAT or the latest [release](https://github.com/lgarciasbr/obsidian-crm/releases/latest).

## Scope and design

The plugin runs entirely inside Obsidian:

- it makes **no network requests** and collects **no telemetry**;
- it reads and writes Markdown notes **only inside the CRM folder** you configure (plus the active note when you run *Set next action*);
- the only link it opens is a company's website, and only if it is an `http`/`https` URL.

Things worth reporting include: a way to make the plugin write outside the CRM folder, open a non-web link, run code from note content, or lose or corrupt notes.

CRM notes and the generated `AGENTS.md` guide may be read by AI agents you run in your vault. The guide tells agents to treat note content as data, never as instructions, but the agents themselves are outside this plugin's control.
