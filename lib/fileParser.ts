/**
 * Client-side file parser for CSV and Excel (.xlsx) files.
 * Converts uploaded files into plain text that can be stored as business context.
 * Uses the 'xlsx' library for proper Excel parsing.
 */

import * as XLSX from "xlsx";

/**
 * Parse a CSV or XLSX file into a readable text string.
 * Returns structured text with columns and rows.
 */
export async function parseUploadedFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    return parseCSV(file);
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseExcel(file);
  }

  throw new Error("Unsupported file type. Please upload a CSV or Excel (.xlsx) file.");
}

async function parseCSV(file: File): Promise<string> {
  const text = await file.text();
  const lines = text.trim().split("\n");
  if (lines.length === 0) return "";

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    return headers.map((h, i) => `${h}: ${cells[i] || ""}`).join(" | ");
  });

  return `Columns: ${headers.join(", ")}\n\nData (${rows.length} rows):\n${rows.join("\n")}`;
}

async function parseExcel(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    const results: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (data.length === 0) continue;

      const headers = (data[0] || []).map((h: any) => String(h || "").trim());
      const rows = data.slice(1).filter((row) => row.some((cell: any) => cell !== null && cell !== ""));

      if (headers.length === 0) continue;

      results.push(`Sheet: ${sheetName}`);
      results.push(`Columns: ${headers.join(", ")}`);
      results.push("");

      for (const row of rows) {
        const formatted = headers
          .map((h, i) => {
            const val = row[i] !== undefined && row[i] !== null ? String(row[i]).trim() : "";
            return val ? `${h}: ${val}` : "";
          })
          .filter(Boolean)
          .join(" | ");
        if (formatted) results.push(formatted);
      }

      results.push("");
    }

    const output = results.join("\n").trim();
    if (!output) return `[Excel file: ${file.name} — no readable data found]`;
    return output;
  } catch (e) {
    console.error("[fileParser] Excel parse error:", e);
    return `[Excel file: ${file.name} — could not parse. Please also enter data manually below.]`;
  }
}
