import { describe, expect, it } from "vitest";

import { csvFilename, escapeCsvCell, toCsv } from "@/lib/csv";

describe("escapeCsvCell", () => {
  it("passes plain values through", () => {
    expect(escapeCsvCell("Ada Lovelace")).toBe("Ada Lovelace");
    expect(escapeCsvCell(42)).toBe("42");
  });

  it("renders null and undefined as empty", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("quotes and doubles embedded quotes", () => {
    expect(escapeCsvCell('He said "hi"')).toBe('"He said ""hi"""');
  });

  it("quotes values containing commas or newlines", () => {
    expect(escapeCsvCell("Smith, John")).toBe('"Smith, John"');
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralises spreadsheet formula injection", () => {
    // Without this, opening the export in Excel executes the cell.
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
    expect(escapeCsvCell("+1234")).toBe("'+1234");
    expect(escapeCsvCell("-1+1")).toBe("'-1+1");
    expect(escapeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("still quotes a risky value that also contains a comma", () => {
    expect(escapeCsvCell("=cmd|'calc',x")).toBe('"\'=cmd|\'calc\',x"');
  });
});

describe("toCsv", () => {
  it("writes CRLF-terminated rows with a trailing newline", () => {
    const csv = toCsv(["a", "b"], [[1, 2], [3, 4]]);
    expect(csv).toBe("a,b\r\n1,2\r\n3,4\r\n");
  });

  it("handles a header-only export", () => {
    expect(toCsv(["only"], [])).toBe("only\r\n");
  });
});

describe("csvFilename", () => {
  it("builds a filesystem-safe timestamped name", () => {
    expect(csvFilename("pulseboard orders", "2026-10-15T09:08:07.123Z")).toBe(
      "pulseboard-orders-2026-10-15T09-08-07.csv",
    );
  });
});
