import type {
  DuplicateReason,
  DuplicateType,
  ImportPayloadRow,
  ImportValidationSummary,
  ValidationIssue,
} from "@/types/student";

export type RawImportRow = Omit<
  ImportPayloadRow,
  | "duplicate"
  | "duplicate_type"
  | "duplicate_reasons"
  | "related_rows"
  | "source_row"
  | "total"
  | "calculated_total"
> & {
  source_row: number;
};

type NormalizedIdentity = {
  normalizedName:string;
  normalizedPrn: string | null;
  normalizedEmail: string | null;
  normalizedPhone: string | null;
};

type PairAnalysis = {
  duplicate: boolean;
  type: DuplicateType;
  reasons: DuplicateReason[];
};

type DuplicateAnalysis = {
  rowFlags: Map<
    number,
    {
      duplicate: boolean;
      duplicateType: DuplicateType | null;
      reasons: DuplicateReason[];
      relatedRows: number[];
    }
  >;
  uniqueStudents: number;
  multipleEntryRecords: number;
  identityConflictRecords: number;
};

function compactValue(value: string | null | undefined) {
  const cleaned = (value ?? "").trim();
  return cleaned.length === 0 ? null : cleaned;
}

export function normalizeEmailForComparison(value: string | null | undefined) {
  const email = compactValue(value);
  return email ? email.toLowerCase() : null;
}

export function normalizePrnForComparison(value: string | null | undefined) {
  const prn = compactValue(value);
  return prn ? prn.toUpperCase() : null;
}

export function normalizePhoneForComparison(value: string | null | undefined) {
  const phone = compactValue(value);
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);

  return digits;
}
function normalizeNameForComparison(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
function normalizeIdentity(row: RawImportRow): NormalizedIdentity {
  return {
    normalizedName: normalizeNameForComparison(row.name),
    normalizedPrn: normalizePrnForComparison(row.prn),
    normalizedEmail: normalizeEmailForComparison(row.email),
    normalizedPhone: normalizePhoneForComparison(row.mobile),
  };
}

export function calculateAuthoritativeTotal(
  row: Pick<
    RawImportRow,
    | "computer_fundamentals"
    | "quantitative_aptitude"
    | "logical_reasoning"
    | "verbal_ability"
    | "pseudocode_debugging"
    | "coding"
  >,
) {
  return (
    row.computer_fundamentals +
    row.quantitative_aptitude +
    row.logical_reasoning +
    row.verbal_ability +
    row.pseudocode_debugging +
    row.coding
  );
}

function same(a: string | null, b: string | null) {
  return a !== null && b !== null && a === b;
}

function comparePair(
  a: NormalizedIdentity,
  b: NormalizedIdentity,
): PairAnalysis | null {
  const reasons: DuplicateReason[] = [];

  const name = same(a.normalizedName, b.normalizedName);
  const prn = same(a.normalizedPrn, b.normalizedPrn);
  const email = same(a.normalizedEmail, b.normalizedEmail);
  const phone = same(a.normalizedPhone, b.normalizedPhone);

  if (prn) reasons.push("duplicate_prn");
  if (email) reasons.push("duplicate_email");
  if (phone) reasons.push("duplicate_phone");

  if (prn && email) reasons.push("duplicate_prn_email");
  if (prn && phone) reasons.push("duplicate_prn_phone");
  if (email && phone) reasons.push("duplicate_email_phone");
  if (prn && email && phone) {
    reasons.push("duplicate_prn_email_phone");
  }

  /*
   * No identity fields match.
   */
  if (reasons.length === 0) {
    return null;
  }

  /*
   * Strong duplicate signals:
   *
   * Same name + PRN
   * Same name + email
   * Same name + phone
   * PRN + email
   * PRN + phone
   * Email + phone
   *
   * A single PRN/email/phone match by itself is NOT enough,
   * because one of those values may have been entered incorrectly.
   */
  const matchingIdentityCount =
    Number(prn) +
    Number(email) +
    Number(phone);

  const strongIdentityMatch =
    matchingIdentityCount >= 2 ||
    (name && matchingIdentityCount >= 1);

  if (strongIdentityMatch) {
    const exactIdentity =
      name &&
      prn &&
      email &&
      phone;

    return {
      duplicate: true,
      type: exactIdentity
        ? "EXACT_DUPLICATE"
        : "MULTIPLE_ENTRY",
      reasons,
    };
  }

  /*
   * Only one identity field matches and the name does not match.
   * This is potentially an incorrectly entered PRN/email/phone.
   */
  return {
    duplicate: true,
    type: "IDENTITY_CONFLICT",
    reasons,
  };
}

function uniqueSorted(values: number[]) {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

function uniqueReasons(reasons: DuplicateReason[]) {
  return Array.from(new Set(reasons));
}

function typePriority(type: DuplicateType) {
  // Strong multiple-entry evidence wins over a weak single-field conflict.
  if (type === "EXACT_DUPLICATE") return 3;
  if (type === "MULTIPLE_ENTRY") return 2;
  return 1;
}

function buildDuplicateAnalysis(rows: RawImportRow[]): DuplicateAnalysis {
  const normalized = rows.map(normalizeIdentity);

  const rowFlags = new Map<
    number,
    {
      duplicate: boolean;
      duplicateType: DuplicateType | null;
      reasons: DuplicateReason[];
      relatedRows: number[];
    }
  >();

  const strongDuplicateParent = rows.map((_, index) => index);

  function findRoot(parent: number[], node: number): number {
    if (parent[node] === node) return node;
    parent[node] = findRoot(parent, parent[node]);
    return parent[node];
  }

  function union(parent: number[], a: number, b: number) {
    const rootA = findRoot(parent, a);
    const rootB = findRoot(parent, b);
    if (rootA !== rootB) parent[rootB] = rootA;
  }

  // Only strong (2+ matching fields) relationships contribute to the
  // "confirmed multiple-entry" student grouping. A lone matching PRN,
  // email, or phone must not collapse two students into one.
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const pair = comparePair(normalized[i], normalized[j]);
      if (pair && typePriority(pair.type) >= 2) {
        union(strongDuplicateParent, i, j);
      }
    }
  }

  const confirmedClusters = new Map<number, number[]>();
  rows.forEach((_, index) => {
    const root = findRoot(strongDuplicateParent, index);
    const cluster = confirmedClusters.get(root) ?? [];
    cluster.push(index);
    confirmedClusters.set(root, cluster);
  });

  const confirmedDuplicateRecords = Array.from(confirmedClusters.values())
    .filter((cluster) => cluster.length > 1)
    .reduce((total, cluster) => total + cluster.length, 0);

  const uniqueStudents = rows.length - confirmedDuplicateRecords + Array.from(
    confirmedClusters.values(),
  ).filter((cluster) => cluster.length > 1).length;

  let multipleEntryRecords = 0;
  let identityConflictRecords = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const reasons: DuplicateReason[] = [];
    const relatedRows = new Set<number>();
    let bestType: DuplicateType | null = null;

    for (let j = 0; j < rows.length; j += 1) {
      if (i === j) continue;

      const pair = comparePair(normalized[i], normalized[j]);
      if (!pair) continue;

      pair.reasons.forEach((reason) => reasons.push(reason));
      relatedRows.add(rows[j].source_row);

      if (
        bestType === null ||
        typePriority(pair.type) > typePriority(bestType)
      ) {
        bestType = pair.type;
      }
    }

    const duplicate = reasons.length > 0;

    rowFlags.set(i, {
      duplicate,
      duplicateType: bestType,
      reasons: uniqueReasons(reasons),
      relatedRows: uniqueSorted(Array.from(relatedRows)),
    });

    if (bestType === "MULTIPLE_ENTRY" || bestType === "EXACT_DUPLICATE") {
      multipleEntryRecords += 1;
    } else if (bestType === "IDENTITY_CONFLICT") {
      identityConflictRecords += 1;
    }
  }

  return {
    rowFlags,
    uniqueStudents,
    multipleEntryRecords,
    identityConflictRecords,
  };
}

function duplicateReasonLabel(reason: DuplicateReason) {
  if (reason === "duplicate_prn") return "PRN matched";
  if (reason === "duplicate_email") return "Email matched";
  if (reason === "duplicate_phone") return "Phone matched";
  if (reason === "duplicate_prn_email") return "PRN + email matched";
  if (reason === "duplicate_prn_phone") return "PRN + phone matched";
  if (reason === "duplicate_email_phone") return "Email + phone matched";
  return "PRN + phone + email matched";
}

function duplicateTitle(type: DuplicateType) {
  if (type === "EXACT_DUPLICATE") return "Exact duplicate candidate";
  if (type === "MULTIPLE_ENTRY") return "Multiple entry detected";
  return "Possible identity conflict";
}

function duplicateMessage(type: DuplicateType) {
  if (type === "EXACT_DUPLICATE") {
    return "This record appears to be an exact duplicate of another entry.";
  }

  if (type === "MULTIPLE_ENTRY") {
    return "The same student appears to have been entered multiple times.";
  }

  return "A single identity field matches another record, but the identifiers may contain an incorrect value. Review the records before deciding which information is correct.";
}

export function validateAndAnnotateImportRows(rows: RawImportRow[]) {
  const issues: ValidationIssue[] = [];
  const duplicateAnalysis = buildDuplicateAnalysis(rows);

  /*
   * Used so the admin does not receive:
   *   Row 282 -> Row 364
   *   Row 364 -> Row 282
   *
   * Instead, each relationship is reported once.
   */
  const reportedRelationships = new Set<string>();

  const enrichedRows: ImportPayloadRow[] = rows.map((row, index) => {
    const calculatedTotal = calculateAuthoritativeTotal(row);
    const excelTotal = row.excel_total;

    if (excelTotal !== calculatedTotal) {
      issues.push({
        type: "error",
        code: "TOTAL_MISMATCH",
        title: "Total mismatch",
        row: row.source_row,
        blocking: true,
        message: `Excel: ${excelTotal} Expected: ${calculatedTotal}`,
        details: [
          `Excel Total: ${excelTotal}`,
          `Calculated Total: ${calculatedTotal}`,
        ],
      });
    }

    const duplicateFlag = duplicateAnalysis.rowFlags.get(index);
    const duplicateReasons = duplicateFlag?.reasons ?? [];
    const relatedRows = duplicateFlag?.relatedRows ?? [];

    if (duplicateFlag?.duplicate && duplicateFlag.duplicateType) {
      /*
       * Create one grouped validation issue per relationship group.
       * This keeps the admin UI readable while both rows still receive
       * duplicate metadata in their ImportPayloadRow.
       */
      const relationshipRows = uniqueSorted([
        row.source_row,
        ...relatedRows,
      ]);

      const relationshipKey = relationshipRows.join(",");

      if (!reportedRelationships.has(relationshipKey)) {
        reportedRelationships.add(relationshipKey);

        const reasonText = uniqueReasons(duplicateReasons)
          .map(duplicateReasonLabel)
          .join(", ");

        const type = duplicateFlag.duplicateType;

        /*
         * Duplicate/identity signals are warnings, not blocking errors.
         *
         * A wrong PRN is possible, so the importer must not prevent an
         * otherwise valid dataset from being imported solely because
         * identity fields appear more than once.
         *
         * Total mismatches remain blocking errors.
         */
        issues.push({
          type: "warning",
          code:
            type === "IDENTITY_CONFLICT"
              ? "POSSIBLE_IDENTITY_CONFLICT"
              : "DUPLICATE_RECORD",
          title: duplicateTitle(type),
          row: row.source_row,
          blocking: false,
          message: duplicateMessage(type),
          details: [
            `Signals: ${reasonText}`,
          ],
          relatedRows,
        });
      }
    }

    return {
      ...row,
      calculated_total: calculatedTotal,
      total: calculatedTotal,
      duplicate: duplicateFlag?.duplicate ?? false,
      duplicate_type: duplicateFlag?.duplicateType ?? null,
      duplicate_reasons: duplicateReasons,
      related_rows: relatedRows,
    };
  });

  const blockingErrors = issues.filter(
    (issue) => issue.type === "error" && issue.blocking !== false,
  ).length;

  const warnings = issues.filter((issue) => issue.type === "warning").length;

  const summary: ImportValidationSummary = {
    recordsFound: rows.length,
    uniqueStudents: duplicateAnalysis.uniqueStudents,
    multipleEntryRecords: duplicateAnalysis.multipleEntryRecords,
    identityConflictRecords: duplicateAnalysis.identityConflictRecords,
    totalMismatches: issues.filter(
      (issue) => issue.code === "TOTAL_MISMATCH",
    ).length,
    blockingErrors,
    warnings,
    requiredColumnsPresent: true,
    numericValuesValid: !issues.some(
      (issue) => issue.code === "INVALID_NUMBER",
    ),
  };

  return {
    rows: enrichedRows,
    issues,
    summary,
  };
}