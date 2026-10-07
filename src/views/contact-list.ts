import { setIcon } from "obsidian";
import { CrmRecord, CrmRepository } from "../crm/repository";
import { cleanLink } from "../crm/links";
import { safeExternalUrl } from "../crm/urls";
import { recordText } from "./records";
import type { CrmViewActions } from "./crm-view";

export interface ListHost {
  readonly repository: CrmRepository;
  readonly actions: CrmViewActions;
  render(): void;
  openRecord(record: CrmRecord): Promise<void>;
  openRelatedRecord(type: "crm/company" | "crm/person", name: string): Promise<void>;
}

export interface ContactViewModel {
  kind: "person" | "company";
  name: string;
  company: string;
  lastContact: string;
  nextAction: string;
  email: string;
  phone: string;
  site: string;
  industry: string;
  peopleCount: number;
  opportunityCount: number;
  record: CrmRecord;
}

// The Companies and Contacts tabs: a searchable list of records.
export class ContactList {
  private contactsSearch = "";

  constructor(private host: ListHost) {}

  resetSearch(): void {
    this.contactsSearch = "";
  }

  render(container: HTMLElement, kind: "person" | "company"): void {
    this.renderContacts(container, kind);
  }

  private renderContacts(container: HTMLElement, kind: "person" | "company"): void {
    const content = container.createDiv({ cls: "crm-contacts" });

    const controls = content.createDiv({ cls: "crm-contacts-controls" });
    const heading = controls.createDiv({ cls: "crm-contacts-heading" });
    heading.createEl("h3", { text: kind === "person" ? "Contacts" : "Companies" });

    const localActions = controls.createDiv({ cls: "crm-contacts-actions" });
    const search = localActions.createEl("input", {
      cls: "crm-contacts-search",
      attr: { type: "search", placeholder: kind === "person" ? "Search contacts..." : "Search companies..." },
    });
    search.value = this.contactsSearch;
    this.renderToolbarButton(
      localActions,
      kind === "person" ? "user" : "building-2",
      kind === "person" ? "New contact" : "New company",
      kind === "person" ? () => this.host.actions.addPerson() : () => this.host.actions.addCompany()
    );

    const table = content.createDiv({ cls: "crm-contacts-table" });
    const renderRows = () => this.renderContactRows(table, kind);
    search.addEventListener("input", () => {
      this.contactsSearch = search.value;
      renderRows();
    });
    renderRows();
  }

  private renderContactRows(table: HTMLElement, kind: "person" | "company"): void {
    table.empty();
    const contacts = this.contactViewModels();
    const query = this.contactsSearch.trim().toLowerCase();
    const filtered = contacts.filter((contact) => {
      const matchesType = contact.kind === kind;
      const matchesSearch = !query || [contact.name, contact.company, contact.nextAction, contact.email, contact.phone, contact.site, contact.industry]
        .some((value) => value.toLowerCase().includes(query));
      return matchesType && matchesSearch;
    });

    if (!filtered.length) {
      table.createDiv({ text: kind === "person" ? "No contacts found." : "No companies found.", cls: "crm-empty-state" });
      return;
    }

    for (const contact of filtered) {
      if (kind === "person") {
        this.renderPersonListItem(table, contact);
      } else {
        this.renderCompanyListItem(table, contact);
      }
    }
  }

  private renderPersonListItem(container: HTMLElement, contact: ContactViewModel): void {
    const item = container.createDiv({ cls: "crm-list-item" });
    const main = item.createDiv({ cls: "crm-list-item-main" });
    const name = main.createSpan({ text: contact.name, cls: "crm-list-title crm-link" });
    name.addEventListener("click", () => void this.host.openRecord(contact.record));

    if (contact.company) {
      const company = main.createSpan({ text: contact.company, cls: "crm-list-meta crm-link" });
      company.addEventListener("click", () => void this.host.openRelatedRecord("crm/company", contact.company));
    }

    const details = [contact.email, contact.phone].filter(Boolean);
    if (details.length) {
      const secondary = item.createDiv({ cls: "crm-list-item-secondary" });
      for (const detail of details) {
        secondary.createSpan({ text: detail });
      }
    }
  }

  private renderCompanyListItem(container: HTMLElement, contact: ContactViewModel): void {
    const item = container.createDiv({ cls: "crm-list-item" });
    const main = item.createDiv({ cls: "crm-list-item-main" });
    const name = main.createSpan({ text: contact.name, cls: "crm-list-title crm-link" });
    name.addEventListener("click", () => void this.host.openRecord(contact.record));
    main.createSpan({ text: `${contact.opportunityCount} opportunit${contact.opportunityCount === 1 ? "y" : "ies"}`, cls: "crm-list-meta" });

    const details = [contact.site, contact.industry].filter(Boolean);
    if (details.length) {
      const secondary = item.createDiv({ cls: "crm-list-item-secondary" });
      const siteUrl = safeExternalUrl(contact.site);
      if (contact.site && siteUrl) {
        const site = secondary.createSpan({ text: contact.site, cls: "crm-link" });
        site.addEventListener("click", () => window.open(siteUrl, "_blank", "noopener"));
      } else if (contact.site) {
        secondary.createSpan({ text: contact.site });
      }
      if (contact.industry) {
        secondary.createSpan({ text: contact.industry });
      }
    }
  }

  private renderToolbarButton(container: HTMLElement, icon: string, label: string, onClick: () => Promise<void> | void): void {
    const button = container.createEl("button", {
      cls: "crm-pipeline-toolbar-button",
      attr: { "aria-label": label, title: label },
    });
    setIcon(button, icon);
    button.createSpan({ text: label });
    button.addEventListener("click", () => {
      void Promise.resolve(onClick()).then(() => this.host.render());
    });
  }

  private contactViewModels(): ContactViewModel[] {
    const repository = this.host.repository;
    return contactViewModels(
      repository.listRecords("crm/person"),
      repository.listRecords("crm/company"),
      repository.listRecords("crm/opportunity")
    );
  }
}

// Rows for both lists; companies count the people and opportunities linked to them.
export function contactViewModels(people: CrmRecord[], companies: CrmRecord[], opportunities: CrmRecord[]): ContactViewModel[] {
  const linksTo = (record: CrmRecord, name: string) => cleanLink(recordText(record, "company")) === name;
  const personRows = people.map((record) => ({
    kind: "person" as const,
    name: record.name,
    company: cleanLink(recordText(record, "company")),
    lastContact: recordText(record, "last_contact"),
    nextAction: recordText(record, "next_action"),
    email: recordText(record, "email"),
    phone: recordText(record, "phone"),
    site: "",
    industry: "",
    peopleCount: 0,
    opportunityCount: 0,
    record,
  }));
  const companyRows = companies.map((record) => ({
    kind: "company" as const,
    name: record.name,
    company: "",
    lastContact: recordText(record, "last_contact"),
    nextAction: recordText(record, "next_action"),
    email: "",
    phone: "",
    site: recordText(record, "site"),
    industry: recordText(record, "industry"),
    peopleCount: people.filter((person) => linksTo(person, record.name)).length,
    opportunityCount: opportunities.filter((opportunity) => linksTo(opportunity, record.name)).length,
    record,
  }));
  return [...personRows, ...companyRows].sort((a, b) => a.name.localeCompare(b.name));
}
