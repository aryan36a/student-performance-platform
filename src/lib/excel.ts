import * as XLSX from "xlsx";
import {
  REQUIRED_HEADERS,
  SUBJECT_MAX_SCORES,
  TOTAL_MAX_SCORE,
} from "@/lib/constants";
import type { ImportPayloadRow, ValidationIssue } from "@/types/student";
import {
  validateAndAnnotateImportRows,
  type RawImportRow,
} from "@/lib/import-validation";
import type { ImportValidationSummary } from "@/types/student";

export type ParsedExcelResult = {
  filename: string;
  rows: ImportPayloadRow[];
  issues: ValidationIssue[];
  headers: string[];
  summary: ImportValidationSummary;
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  return NaN;
}

function normalizeHeader(header: string) {
  return header.replace(/\s+/g, " ").trim();
}

export function parseExcelBuffer(
  buffer: ArrayBuffer,
  filename: string,
): ParsedExcelResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) {
    return {
      filename,
      rows: [],
      headers: [],
      issues: [
        {
          type: "error",
          code: "NO_SHEET",
          title: "Invalid workbook",
          message: "The uploaded workbook does not contain any sheets.",
        },
      ],
      summary: {
        recordsFound: 0,
        uniqueStudents: 0,
        multipleEntryRecords: 0,
        identityConflictRecords: 0,
        totalMismatches: 0,
        blockingErrors: 1,
        warnings: 0,
        requiredColumnsPresent: false,
        numericValuesValid: false,
      },
    };
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    firstSheet,
    {
      defval: "",
      raw: false,
    },
  );

  if (rawRows.length === 0) {
    return {
      filename,
      rows: [],
      headers: [],
      issues: [
        {
          type: "error",
          code: "EMPTY_FILE",
          title: "Empty file",
          message: "The uploaded file is empty.",
        },
      ],
      summary: {
        recordsFound: 0,
        uniqueStudents: 0,
        multipleEntryRecords: 0,
        identityConflictRecords: 0,
        totalMismatches: 0,
        blockingErrors: 1,
        warnings: 0,
        requiredColumnsPresent: false,
        numericValuesValid: false,
      },
    };
  }

  const headers = Object.keys(rawRows[0]).map(normalizeHeader);
  const missingHeaders = REQUIRED_HEADERS.filter(
    (required) => !headers.includes(required),
  );

  if (missingHeaders.length > 0) {
    return {
      filename,
      rows: [],
      headers,
      issues: missingHeaders.map((column) => ({
        type: "error" as const,
        code: "MISSING_COLUMN",
        title: "Missing required column",
        message: `Missing required column: ${column}`,
        blocking: true,
      })),
      summary: {
        recordsFound: rawRows.length,
        uniqueStudents: 0,
        multipleEntryRecords: 0,
        identityConflictRecords: 0,
        totalMismatches: 0,
        blockingErrors: missingHeaders.length,
        warnings: 0,
        requiredColumnsPresent: false,
        numericValuesValid: false,
      },
    };
  }

  const issues: ValidationIssue[] = [];
  const parsedRows: RawImportRow[] = [];
  let numericValuesValid = true;

  rawRows.forEach((rawRow, idx) => {
    // Excel header is row 1, so the first data row is row 2.
    const rowNumber = idx + 2;

    const normalizedEntries = Object.entries(rawRow).reduce<
      Record<string, unknown>
    >((acc, [key, value]) => {
      acc[normalizeHeader(key)] = value;
      return acc;
    }, {});

    const row = {
      name: String(normalizedEntries.Name ?? "").trim(),
      mobile: String(normalizedEntries.Mobile ?? "").trim() || null,
      email: String(normalizedEntries.Email ?? "").trim() || null,
      branch: String(normalizedEntries.Branch ?? "").trim(),
      division: String(normalizedEntries.Division ?? "").trim(),
      prn: String(normalizedEntries["University PRN"] ?? "").trim(),
      computer_fundamentals: toNumber(
        normalizedEntries["Computer Fundamentals"],
      ),
      quantitative_aptitude: toNumber(
        normalizedEntries["Quantitative Aptitude"],
      ),
      logical_reasoning: toNumber(normalizedEntries["Logical Reasoning"]),
      verbal_ability: toNumber(normalizedEntries["Verbal Ability"]),
      pseudocode_debugging: toNumber(
        normalizedEntries["Pseudocode & Debugging"],
      ),
      coding: toNumber(normalizedEntries.Coding),
      excel_total: toNumber(normalizedEntries.Total),
      source_row: rowNumber,
    } satisfies RawImportRow;

    if (!row.name || !row.branch || !row.division || !row.prn) {
      issues.push({
        type: "error",
        code: "MISSING_REQUIRED_TEXT",
        title: "Missing required fields",
        row: rowNumber,
        message:
          "Required text fields (Name, Branch, Division, University PRN) cannot be empty.",
        blocking: true,
      });
    }

    const subjects: Array<[keyof typeof SUBJECT_MAX_SCORES, number]> = [
      ["computer_fundamentals", row.computer_fundamentals],
      ["quantitative_aptitude", row.quantitative_aptitude],
      ["logical_reasoning", row.logical_reasoning],
      ["verbal_ability", row.verbal_ability],
      ["pseudocode_debugging", row.pseudocode_debugging],
      ["coding", row.coding],
    ];

    subjects.forEach(([key, value]) => {
      if (!Number.isFinite(value)) {
        numericValuesValid = false;
        issues.push({
          type: "error",
          code: "INVALID_NUMBER",
          title: "Invalid numerical value",
          row: rowNumber,
          message: `${key} is not a valid number.`,
          blocking: true,
        });
        return;
      }

      if (value < 0) {
        issues.push({
          type: "error",
          code: "NEGATIVE_NUMBER",
          title: "Negative score",
          row: rowNumber,
          message: `${key} cannot be negative.`,
          blocking: true,
        });
        return;
      }

      const maximum = SUBJECT_MAX_SCORES[key];

      if (value > maximum) {
        issues.push({
          type: "error",
          code: "SUBJECT_SCORE_HIGH",
          title: "Subject score exceeds maximum",
          row: rowNumber,
          message: `${key} is ${value}, but the maximum is ${maximum}.`,
          blocking: true,
        });
      }
    });

    if (Number.isFinite(row.excel_total)) {
      if (row.excel_total < 0) {
        issues.push({
          type: "error",
          code: "NEGATIVE_NUMBER",
          title: "Negative total",
          row: rowNumber,
          message: "Total cannot be negative.",
          blocking: true,
        });
      }

      if (row.excel_total > TOTAL_MAX_SCORE) {
        issues.push({
          type: "error",
          code: "TOTAL_SCORE_HIGH",
          title: "Total exceeds maximum",
          row: rowNumber,
          message: `Total is ${row.excel_total}, but the maximum is ${TOTAL_MAX_SCORE}.`,
          blocking: true,
        });
      }
    } else {
      numericValuesValid = false;
      issues.push({
        type: "error",
        code: "INVALID_NUMBER",
        title: "Invalid numerical value",
        row: rowNumber,
        message: "Total is not a valid number.",
        blocking: true,
      });
    }

    parsedRows.push(row);
  });

  const validated = validateAndAnnotateImportRows(parsedRows);
  issues.push(...validated.issues);

  const summary: ImportValidationSummary = {
    ...validated.summary,
    requiredColumnsPresent: true,
    numericValuesValid,
    blockingErrors: issues.filter(
      (issue) => issue.type === "error" && issue.blocking !== false,
    ).length,
    warnings: issues.filter((issue) => issue.type === "warning").length,
  };

  return {
    filename,
    rows: validated.rows,
    issues,
    headers,
    summary,
  };
}