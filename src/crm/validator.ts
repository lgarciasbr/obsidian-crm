// Pure vault-level validation over CRM records. No "obsidian" import.
// See docs/data-contract.md.
import { validateFrontmatter, findDuplicateBasenames, Violation } from "./integrity";

export interface RecordInput {
  type: string;
  name: string;
  basename: string;
  path: string;
  frontmatter: Record<string, unknown>;
}

export interface RecordReport {
  path: string;
  basename: string;
  type: string;
  violations: Violation[];
}

export interface VaultReport {
  total: number;
  clean: number;
  records: RecordReport[];
  duplicates: Violation[];
}

export function validateRecords(records: RecordInput[], stages?: readonly string[]): VaultReport {
  const perRecord: RecordReport[] = records.map((record) => ({
    path: record.path,
    basename: record.basename,
    type: record.type,
    violations: validateFrontmatter(record.type, record.frontmatter, { stages }),
  }));

  const duplicates = findDuplicateBasenames(records.map((r) => ({ type: r.type, basename: r.basename })));
  const withIssues = perRecord.filter((r) => r.violations.length > 0);

  return {
    total: records.length,
    clean: records.length - withIssues.length,
    records: withIssues,
    duplicates,
  };
}

export function renderReport(report: VaultReport, generatedAt: string): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push("type: crm/validation-report");
  lines.push(`generated: ${generatedAt}`);
  lines.push("---");
  lines.push("");
  lines.push("# CRM Validation Report");
  lines.push("");
  const issueCount = report.records.length + (report.duplicates.length ? 1 : 0);
  if (issueCount === 0) {
    lines.push(`✅ ${report.total} records checked. No contract violations found.`);
    lines.push("");
    return lines.join("\n");
  }

  lines.push(`Checked **${report.total}** records — **${report.clean}** clean, **${report.records.length}** with issues.`);
  lines.push("");

  if (report.duplicates.length) {
    lines.push("## Duplicate basenames");
    lines.push("");
    for (const dup of report.duplicates) {
      lines.push(`- ⚠️ ${dup.message}`);
    }
    lines.push("");
  }

  if (report.records.length) {
    lines.push("## Records with violations");
    lines.push("");
    for (const record of report.records) {
      lines.push(`### [[${record.basename}]] (${record.type})`);
      lines.push("");
      for (const v of record.violations) {
        const field = v.field ? ` \`${v.field}\`` : "";
        lines.push(`- ❌ **${v.code}**${field}: ${v.message}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
