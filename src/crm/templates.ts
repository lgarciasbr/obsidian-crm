import { crmId } from "./file-names";
import { frontmatter } from "./frontmatter";

// The single source of every note the CRM writes. The plugin creates notes
// with these functions and the agent guide shows their output as examples,
// so the two cannot drift apart.

export interface CompanyFields {
  name: string;
  site?: string;
  industry?: string;
}

export interface PersonFields {
  name: string;
  company?: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
}

export interface OpportunityFields {
  name: string;
  companyLabel: string;
  company: string;
  contact: string;
  stage: string;
  value?: string;
  notes?: string;
  created: string;
}

export interface InteractionFields {
  title: string;
  date: string;
  kind: string;
  people: string[];
  company: string;
  opportunity: string;
  nextAction?: string;
  nextActionDate?: string;
  summary?: string;
  task?: string;
}

const FOLLOW_UP = { last_contact: "", next_action: "", next_action_date: "" };

export function companyNote(fields: CompanyFields): string {
  const name = fields.name.trim();
  return frontmatter({
    type: "crm/company",
    crm_id: crmId("company", name),
    name,
    site: fields.site ?? "",
    industry: fields.industry ?? "",
    ...FOLLOW_UP,
    tags: ["crm/company"],
  }, body(name, ["Context", "People", "Opportunities", "History"]));
}

export function personNote(fields: PersonFields): string {
  const name = fields.name.trim();
  return frontmatter({
    type: "crm/person",
    crm_id: crmId("person", name),
    name,
    company: fields.company ?? "",
    role: fields.role ?? "",
    email: fields.email ?? "",
    phone: fields.phone ?? "",
    linkedin: fields.linkedin ?? "",
    ...FOLLOW_UP,
    tags: ["crm/person"],
  }, body(name, ["Context", "Opportunities", "History"]));
}

export function opportunityTitle(companyLabel: string, name: string): string {
  return `${companyLabel} - ${name}`;
}

export function opportunityNote(fields: OpportunityFields): string {
  const name = fields.name.trim();
  const title = opportunityTitle(fields.companyLabel, name);
  return frontmatter({
    type: "crm/opportunity",
    crm_id: crmId("opportunity", `${fields.companyLabel}-${name}`),
    name,
    company: fields.company,
    contact: fields.contact,
    stage: fields.stage,
    value: fields.value ?? "",
    notes: fields.notes ?? "",
    created: fields.created,
    ...FOLLOW_UP,
    tags: ["crm/opportunity"],
  }, body(title, ["Company", "Contact", "Situation", "Pain points", "Value proposition", "Next steps", "History"], {
    Company: fields.company,
    Contact: fields.contact,
  }));
}

export function interactionTitle(date: string, kind: string, target: string): string {
  return `${date} - ${kind} - ${target}`;
}

export function interactionNote(fields: InteractionFields): string {
  return frontmatter({
    type: "crm/interaction",
    crm_id: crmId("interaction", fields.title),
    date: fields.date,
    kind: fields.kind,
    people: fields.people,
    company: fields.company,
    opportunity: fields.opportunity,
    next_action: fields.nextAction ?? "",
    next_action_date: fields.nextActionDate ?? "",
    tags: ["crm/interaction"],
  }, body(fields.title, ["Summary", "Key points", "Commitments", "Next action"], {
    Summary: fields.summary ?? "",
    "Next action": fields.task || fields.nextAction || "",
  }));
}

function body(title: string, headings: string[], content: Record<string, string> = {}): string {
  const sections = headings.map((heading) => {
    const text = content[heading]?.trim();
    return text ? `## ${heading}\n\n${text}\n` : `## ${heading}\n`;
  });
  return `# ${title}\n\n${sections.join("\n")}`;
}
