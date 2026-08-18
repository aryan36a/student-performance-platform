"use client";

import { useMemo, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  LoaderCircle,
} from "lucide-react";

import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import { parseExcelBuffer } from "@/lib/excel";
import type {
  ImportPayloadRow,
  ImportValidationSummary,
  ValidationIssue,
} from "@/types/student";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImportPreview } from "@/components/admin/import-preview";

type ImportPhase =
  | "idle"
  | "ready"
  | "importing"
  | "done";

type MaxScores = {
  computer_fundamentals: number;
  quantitative_aptitude: number;
  logical_reasoning: number;
  verbal_ability: number;
  pseudocode_debugging: number;
  coding: number;
};

const SUBJECTS: {
  key: keyof MaxScores;
  label: string;
}[] = [
  {
    key: "computer_fundamentals",
    label: "Computer Fundamentals",
  },
  {
    key: "quantitative_aptitude",
    label: "Quantitative Aptitude",
  },
  {
    key: "logical_reasoning",
    label: "Logical Reasoning",
  },
  {
    key: "verbal_ability",
    label: "Verbal Ability",
  },
  {
    key: "pseudocode_debugging",
    label: "Pseudocode & Debugging",
  },
  {
    key: "coding",
    label: "Coding",
  },
];

const DEFAULT_MAX_SCORES: MaxScores = {
  computer_fundamentals: 10,
  quantitative_aptitude: 10,
  logical_reasoning: 10,
  verbal_ability: 10,
  pseudocode_debugging: 10,
  coding: 20,
};

function issueLabel(issue: ValidationIssue): string {
  if (issue.code === "TOTAL_MISMATCH") return "Total mismatch";
  if (issue.code === "DUPLICATE_RECORD") return "Multiple entry";

  if (
    issue.code === "POSSIBLE_IDENTITY_CONFLICT" ||
    issue.code === "IDENTITY_CONFLICT"
  ) {
    return "Possible identity conflict";
  }

  if (issue.code === "MISSING_REQUIRED_TEXT") {
    return "Missing required fields";
  }

  if (issue.code === "INVALID_NUMBER") {
    return "Invalid numeric value";
  }

  if (issue.code === "NEGATIVE_NUMBER") {
    return "Negative score";
  }

  if (issue.code === "MISSING_COLUMN") {
    return "Missing column";
  }

  if (issue.code === "NO_SHEET") {
    return "Invalid workbook";
  }

  if (issue.code === "EMPTY_FILE") {
    return "Empty file";
  }

  return issue.title;
}

function IssueCard({
  issue,
}: {
  issue: ValidationIssue;
}) {
  const tone =
    issue.type === "error" ? "error" : "warning";

  return (
    <Alert tone={tone}>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {issue.row != null
            ? `Row ${issue.row} — `
            : ""}
          {issueLabel(issue)}
        </p>

        <p className="text-sm">{issue.message}</p>

        {issue.details?.map((line) => (
          <p
            key={line}
            className="text-xs opacity-80"
          >
            {line}
          </p>
        ))}

        {issue.relatedRows &&
        issue.relatedRows.length > 0 ? (
          <p className="text-xs opacity-80">
            Related rows:{" "}
            {issue.relatedRows.join(", ")}
          </p>
        ) : null}
      </div>
    </Alert>
  );
}

export function UploadDropzone({
  onImported,
}: {
  onImported: () => void;
}) {
  const [phase, setPhase] =
    useState<ImportPhase>("idle");

  const [filename, setFilename] =
    useState("");

  const [rows, setRows] =
    useState<ImportPayloadRow[]>([]);

  const [issues, setIssues] =
    useState<ValidationIssue[]>([]);

  const [summary, setSummary] =
    useState<ImportValidationSummary | null>(
      null,
    );

  const [uploadError, setUploadError] =
    useState<string | null>(null);

  const [testName, setTestName] =
    useState("");

  const [maxScores, setMaxScores] =
    useState<MaxScores>(DEFAULT_MAX_SCORES);

  const blockingErrorCount = useMemo(
    () =>
      issues.filter(
        (issue) =>
          issue.type === "error" &&
          issue.blocking !== false,
      ).length,
    [issues],
  );

  const warningCount = useMemo(
    () =>
      issues.filter(
        (issue) => issue.type === "warning",
      ).length,
    [issues],
  );

  const hasBlockingErrors =
    blockingErrorCount > 0;

  const totalMaxScore = useMemo(
    () =>
      Object.values(maxScores).reduce(
        (sum, value) => sum + value,
        0,
      ),
    [maxScores],
  );

  const maxScoreError = useMemo(() => {
    for (const subject of SUBJECTS) {
      const value = maxScores[subject.key];

      if (!Number.isFinite(value) || value <= 0) {
        return `${subject.label} must have a maximum mark greater than 0.`;
      }
    }

    return null;
  }, [maxScores]);

  const configurationValid =
    testName.trim().length > 0 &&
    maxScoreError === null &&
    totalMaxScore > 0;

  const progress =
    phase === "idle"
      ? 0
      : phase === "ready"
        ? 70
        : phase === "importing"
          ? 92
          : 100;

  async function processFile(file: File) {
    setUploadError(null);

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setUploadError(
        "Only .xlsx files are supported.",
      );
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setUploadError(
        "File is too large. Maximum file size is 6 MB.",
      );
      return;
    }

    const buffer = await file.arrayBuffer();

    const parsed = parseExcelBuffer(
      buffer,
      file.name,
    );

    setFilename(parsed.filename);
    setRows(parsed.rows);
    setIssues(parsed.issues);
    setSummary(parsed.summary);

    /*
     * Use filename as the initial test name.
     * Admin can change it before uploading.
     */
    setTestName(
      parsed.filename.replace(/\.xlsx$/i, ""),
    );

    setPhase("ready");
  }

  function resetUpload() {
    setPhase("idle");
    setFilename("");
    setRows([]);
    setIssues([]);
    setSummary(null);
    setUploadError(null);
    setTestName("");
    setMaxScores(DEFAULT_MAX_SCORES);
  }

async function handleCommit() {
  if (
    hasBlockingErrors ||
    rows.length === 0 ||
    !configurationValid
  ) {
    return;
  }

  setPhase("importing");
  setUploadError(null);

  try {
    const response = await fetch(
      "/api/admin/import",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename,
          testName: testName.trim(),
          maxScores,
          warningCount,
          summary,
          rows,
        }),
      },
    );

    const payload =
      (await response.json()) as {
        error?: string;
        issues?: ValidationIssue[];
      };

    // -------------------------
    // IMPORT FAILED
    // -------------------------
    if (!response.ok) {
      setUploadError(
        payload.error ?? "Import failed.",
      );

      if (Array.isArray(payload.issues)) {
        setIssues(payload.issues);
      }

      setPhase("ready");
      return;
    }

    // -------------------------
    // IMPORT SUCCESSFUL
    // -------------------------
    setPhase("done");

    onImported();

    // Reload only after successful import
    window.location.reload();

  } catch {
    setUploadError(
      "Network error while importing file.",
    );

    setPhase("ready");
  }
}

  const sortedIssues = useMemo(
    () => [
      ...issues.filter(
        (issue) => issue.type === "error",
      ),
      ...issues.filter(
        (issue) => issue.type === "warning",
      ),
    ],
    [issues],
  );

  const visibleIssues =
    sortedIssues.slice(0, 20);

  const hiddenCount =
    sortedIssues.length -
    visibleIssues.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Import Test Dataset
        </CardTitle>

        <CardDescription>
          Upload an Excel dataset, configure the
          maximum marks for each subject, then
          import the test.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {phase === "idle" ? (
          <label
            htmlFor="excel-upload"
            className="group block cursor-pointer rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center transition-colors hover:border-zinc-500 hover:bg-zinc-100"
            onDragOver={(event) =>
              event.preventDefault()
            }
            onDrop={(event) => {
              event.preventDefault();

              const file =
                event.dataTransfer.files.item(0);

              if (file) {
                void processFile(file);
              }
            }}
          >
            <input
              id="excel-upload"
              type="file"
              className="hidden"
              accept=".xlsx"
              onChange={(event) => {
                const file =
                  event.target.files?.item(0);

                if (file) {
                  void processFile(file);
                }
              }}
            />

            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 bg-white">
              <Upload className="h-5 w-5 text-zinc-600" />
            </div>

            <p className="text-sm font-medium text-zinc-900">
              Drop your Excel file here
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              or click to browse (.xlsx only)
            </p>
          </label>
        ) : null}

        {uploadError ? (
          <Alert tone="error">
            {uploadError}
          </Alert>
        ) : null}

        {phase !== "idle" ? (
          <div className="space-y-1">
            <div className="h-1.5 overflow-hidden rounded bg-zinc-200">
              <div
                className="h-full bg-zinc-900 transition-all duration-200"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <p className="text-xs text-zinc-500">
              {phase === "ready"
                ? "Parsed and validated. Configure the test before importing."
                : phase === "importing"
                  ? "Import in progress…"
                  : "Import completed."}
            </p>
          </div>
        ) : null}

        {phase !== "idle" ? (
          <div className="rounded-md border border-zinc-200 bg-white p-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-zinc-500" />

                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {filename}
                  </p>

                  <p className="text-xs text-zinc-500">
                    {rows.length} rows parsed
                  </p>
                </div>
              </div>

              <div className="text-right text-xs text-zinc-500">
                <p
                  className={
                    hasBlockingErrors
                      ? "font-medium text-red-700"
                      : "font-medium text-emerald-700"
                  }
                >
                  {hasBlockingErrors
                    ? "Contains blocking errors"
                    : "Ready to import"}
                </p>

                {blockingErrorCount > 0 ? (
                  <p className="text-red-700">
                    {blockingErrorCount} blocking
                    errors
                  </p>
                ) : null}

                {warningCount > 0 ? (
                  <p className="text-amber-700">
                    {warningCount} warnings
                  </p>
                ) : null}
              </div>
            </div>

            {!hasBlockingErrors ? (
              <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-zinc-900">
                    Configure Test
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Enter the maximum marks for each
                    subject. These values are used for
                    percentage calculations.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700">
                      Test Name
                    </label>

                    <input
                      type="text"
                      value={testName}
                      onChange={(event) =>
                        setTestName(
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Aptitude Test 3"
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    />
                  </div>

                  <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
                    <div className="grid grid-cols-[1fr_130px] border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-500">
                      <span>Subject</span>
                      <span className="text-right">
                        Maximum Marks
                      </span>
                    </div>

                    {SUBJECTS.map((subject) => (
                      <div
                        key={subject.key}
                        className="grid grid-cols-[1fr_130px] items-center border-b border-zinc-100 px-3 py-2.5 last:border-b-0"
                      >
                        <span className="text-sm text-zinc-800">
                          {subject.label}
                        </span>

                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={
                            maxScores[
                              subject.key
                            ]
                          }
                          onChange={(event) => {
                            const value =
                              Number(
                                event.target.value,
                              );

                            setMaxScores(
                              (current) => ({
                                ...current,
                                [subject.key]:
                                  Number.isFinite(
                                    value,
                                  )
                                    ? value
                                    : 0,
                              }),
                            );
                          }}
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-right text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
                    <span className="text-sm font-medium text-zinc-700">
                      Total Maximum Marks
                    </span>

                    <span className="text-sm font-semibold text-zinc-900">
                      {totalMaxScore}
                    </span>
                  </div>

                  {!testName.trim() ? (
                    <p className="text-xs text-red-600">
                      Enter a test name.
                    </p>
                  ) : null}

                  {maxScoreError ? (
                    <p className="text-xs text-red-600">
                      {maxScoreError}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={resetUpload}
                disabled={
                  phase === "importing"
                }
              >
                Cancel
              </Button>

              <Button
                disabled={
                  hasBlockingErrors ||
                  rows.length === 0 ||
                  !configurationValid ||
                  phase === "importing"
                }
                onClick={() =>
                  void handleCommit()
                }
              >
                {phase === "importing" ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Uploading Dataset
                  </span>
                ) : (
                  "Upload Dataset"
                )}
              </Button>
            </div>

            {hasBlockingErrors ? (
              <p className="mt-2 text-xs text-red-600">
                Fix all blocking errors in the Excel
                file and re-upload.
              </p>
            ) : warningCount > 0 ? (
              <p className="mt-2 text-xs text-amber-700">
                {warningCount} warning
                {warningCount !== 1
                  ? "s"
                  : ""}{" "}
                detected. Review them before
                importing.
              </p>
            ) : null}
          </div>
        ) : null}

        {summary ? (
          <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-zinc-900">
                Validation Summary
              </p>

              <p
                className={
                  hasBlockingErrors
                    ? "text-xs font-medium text-red-700"
                    : "text-xs font-medium text-emerald-700"
                }
              >
                {hasBlockingErrors
                  ? "Import blocked"
                  : "No blocking errors"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-700 sm:grid-cols-4">
              <span>Raw entries</span>
              <span className="text-right font-medium">
                {summary.recordsFound}
              </span>

              <span>Unique students</span>
              <span className="text-right font-medium">
                {summary.uniqueStudents}
              </span>

              <span>Multiple-entry records</span>
              <span
                className={`text-right font-medium ${
                  summary.multipleEntryRecords > 0
                    ? "text-amber-700"
                    : ""
                }`}
              >
                {summary.multipleEntryRecords}
              </span>

              <span>Identity conflicts</span>
              <span
                className={`text-right font-medium ${
                  summary.identityConflictRecords >
                  0
                    ? "text-orange-700"
                    : ""
                }`}
              >
                {summary.identityConflictRecords}
              </span>

              <span>Total mismatches</span>
              <span
                className={`text-right font-medium ${
                  summary.totalMismatches > 0
                    ? "text-red-700"
                    : "text-emerald-700"
                }`}
              >
                {summary.totalMismatches}
              </span>

              <span>Blocking errors</span>
              <span
                className={`text-right font-medium ${
                  blockingErrorCount > 0
                    ? "text-red-700"
                    : "text-emerald-700"
                }`}
              >
                {blockingErrorCount}
              </span>

              <span>Warnings</span>
              <span
                className={`text-right font-medium ${
                  warningCount > 0
                    ? "text-amber-700"
                    : "text-emerald-700"
                }`}
              >
                {warningCount}
              </span>
            </div>

            <div className="space-y-0.5 border-t border-zinc-200 pt-2 text-xs">
              <p
                className={
                  summary.requiredColumnsPresent
                    ? "text-emerald-700"
                    : "text-red-700"
                }
              >
                {summary.requiredColumnsPresent
                  ? "✓"
                  : "❌"}{" "}
                Required columns present
              </p>

              <p
                className={
                  summary.numericValuesValid
                    ? "text-emerald-700"
                    : "text-red-700"
                }
              >
                {summary.numericValuesValid
                  ? "✓"
                  : "❌"}{" "}
                Numeric values valid
              </p>
            </div>
          </div>
        ) : null}

        {visibleIssues.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
              {sortedIssues.length} validation
              issue
              {sortedIssues.length !== 1
                ? "s"
                : ""}
              {" — "}
              {blockingErrorCount} blocking
              {" — "}
              {warningCount} warning
              {warningCount !== 1 ? "s" : ""}
            </p>

            {visibleIssues.map(
              (issue, index) => (
                <IssueCard
                  key={`${issue.code}-${issue.row ?? ""}-${index}`}
                  issue={issue}
                />
              ),
            )}

            {hiddenCount > 0 ? (
              <p className="text-xs text-zinc-500">
                +{hiddenCount} more validation
                issue
                {hiddenCount !== 1 ? "s" : ""}.
              </p>
            ) : null}
          </div>
        ) : null}

        {rows.length > 0 ? (
          <ImportPreview rows={rows} />
        ) : null}
      </CardContent>
    </Card>
  );
}