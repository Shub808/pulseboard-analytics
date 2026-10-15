/**
 * Minimal, dependency-free CSV serialisation.
 *
 * The escaping matters more than it looks: a customer name containing a comma,
 * a quote or a newline will silently corrupt a naive join, and a leading `=`,
 * `+`, `-` or `@` is interpreted as a formula by Excel and Google Sheets
 * (CSV injection). Both are handled here, once, for every export.
 */

export type CsvCell = string | number | null | undefined;

const RISKY_PREFIX = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (RISKY_PREFIX.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(","));
  }
  // CRLF is what Excel expects; a trailing newline keeps POSIX tools happy.
  return `${lines.join("\r\n")}\r\n`;
}

/** Safe, timestamped download name. */
export function csvFilename(prefix: string, isoNow = new Date().toISOString()) {
  const stamp = isoNow.replace(/[:.]/g, "-").slice(0, 19);
  const safePrefix = prefix.replace(/[^a-z0-9-]/gi, "-");
  return `${safePrefix}-${stamp}.csv`;
}
