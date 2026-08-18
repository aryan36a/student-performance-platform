import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateAndAnnotateImportRows } from "@/lib/import-validation";
import type { ImportPayloadRow, ValidationIssue } from "@/types/student";

// Shape sent from the browser by upload-dropzone.tsx
type MaxScores = {
  computer_fundamentals: number;
  quantitative_aptitude: number;
  logical_reasoning: number;
  verbal_ability: number;
  pseudocode_debugging: number;
  coding: number;
};

type ImportRequestBody = {
  filename: string;

  testName: string;

  maxScores: MaxScores;

  warningCount: number;

  summary: {
    recordsFound: number;
    uniqueStudents: number;
    multipleEntryRecords: number;
    identityConflictRecords: number;
    totalMismatches: number;
    blockingErrors: number;
    warnings: number;
    requiredColumnsPresent: boolean;
    numericValuesValid: boolean;
  };

  rows: ImportPayloadRow[];
};

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  // ── Auth ────────────────────────────────────────────────────────────────────
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminCheck } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!adminCheck) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: ImportRequestBody;
  try {
    body = (await request.json()) as ImportRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
  filename,
  testName,
  maxScores,
  rows,
  summary,
} = body;

  if (
  !filename ||
  !testName?.trim() ||
  !maxScores ||
  !Array.isArray(rows) ||
  rows.length === 0
) {
  return NextResponse.json(
    {
      error:
        "filename, testName, maxScores and a non-empty rows array are required",
    },
    { status: 400 },
  );
}
const maxScoreKeys: (keyof MaxScores)[] = [
  "computer_fundamentals",
  "quantitative_aptitude",
  "logical_reasoning",
  "verbal_ability",
  "pseudocode_debugging",
  "coding",
];

for (const key of maxScoreKeys) {
  const value = maxScores[key];

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return NextResponse.json(
      {
        error: `Invalid maximum mark for ${key}.`,
      },
      { status: 400 },
    );
  }
}

  // ── Server-side re-validation (never trust client-side results) ─────────────
  //
  // The browser already ran parseExcelBuffer → validateAndAnnotateImportRows
  // but we re-run validation server-side using the raw field values from
  // each ImportPayloadRow before touching the database.
  //
  // We reconstruct RawImportRow objects from the payload so we can pass them
  // through the same validation pipeline without re-parsing the Excel file
  // (which never reaches the server — only the typed rows do).

  const rawRows = rows.map((row) => ({
    name: row.name,
    mobile: row.mobile,
    email: row.email,
    prn: row.prn,
    branch: row.branch,
    division: row.division,
    computer_fundamentals: row.computer_fundamentals,
    quantitative_aptitude: row.quantitative_aptitude,
    logical_reasoning: row.logical_reasoning,
    verbal_ability: row.verbal_ability,
    pseudocode_debugging: row.pseudocode_debugging,
    coding: row.coding,
    excel_total: row.excel_total,
    source_row: row.source_row,
  }));

  const validated = validateAndAnnotateImportRows(rawRows);

  const serverBlockingErrors = validated.issues.filter(
    (issue): issue is ValidationIssue => issue.type === "error",
  );

  if (serverBlockingErrors.length > 0) {
    return NextResponse.json(
      {
        error: `Import rejected: ${serverBlockingErrors.length} blocking error(s) found during server-side validation.`,
        issues: validated.issues,
        summary: validated.summary,
      },
      { status: 422 },
    );
  }

  // ── Build RPC payload ───────────────────────────────────────────────────────
  //
  // Only public-safe fields go into the JSON payload that lands in the DB.
  // mobile/email/prn are inserted into the private students table by the RPC
  // but NOT into student_public_scores.
  //
  // has_multiple_entries = true when duplicate flag is set on a row.
  // duplicate_type mirrors the validation result.

  const rpcPayload = validated.rows.map((row) => ({
    name: row.name,
    mobile: row.mobile,
    email: row.email,
    prn: row.prn,
    branch: row.branch,
    division: row.division,
    computer_fundamentals: row.computer_fundamentals,
    quantitative_aptitude: row.quantitative_aptitude,
    logical_reasoning: row.logical_reasoning,
    verbal_ability: row.verbal_ability,
    pseudocode_debugging: row.pseudocode_debugging,
    coding: row.coding,
    // Authoritative total — always the sum of subjects, never the Excel cell.
    total: row.total,
    has_multiple_entries:
    row.duplicate_type === "EXACT_DUPLICATE" ||
    row.duplicate_type === "MULTIPLE_ENTRY",
    duplicate_type: row.duplicate_type ?? null,
  }));

const { error: rpcError } = await supabase.rpc(
  "replace_student_dataset",
  {
    payload: rpcPayload,

    p_filename: filename,

    p_test_name: testName.trim(),

    p_max_scores: maxScores,

    p_warning_count:
      validated.summary.warnings,

    p_raw_entries:
      validated.summary.recordsFound,

    p_unique_students:
      validated.summary.uniqueStudents,

    p_multiple_entry_records:
      validated.summary.multipleEntryRecords,

    p_identity_conflict_records:
      validated.summary.identityConflictRecords,
  },
);

if (rpcError) {
  console.error("[import] RPC error:", rpcError);

  return NextResponse.json(
    {
      error: "Database error during import.",
      details: rpcError.message,
      code: rpcError.code,
      hint: rpcError.hint,
      detailsFromSupabase: rpcError.details,
    },
    { status: 500 },
  );
}

  return NextResponse.json({
    ok: true,
    studentCount: rpcPayload.length,
    summary: {
      ...validated.summary,
      // Pass back the client summary fields the browser cares about.
      recordsFound: summary?.recordsFound ?? validated.summary.recordsFound,
    },
  });
}
