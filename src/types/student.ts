export type SubjectKey =
  | "computer_fundamentals"
  | "quantitative_aptitude"
  | "logical_reasoning"
  | "verbal_ability"
  | "pseudocode_debugging"
  | "coding";

export type StudentPublicScore = {
  id: string;
  student_id: string;
  import_id: string;
  name: string;
  branch: string;
  division: string;
  computer_fundamentals: number;
  quantitative_aptitude: number;
  logical_reasoning: number;
  verbal_ability: number;
  pseudocode_debugging: number;
  coding: number;
  total: number;
  has_multiple_entries: boolean;
  duplicate_type: DuplicateType | null;
  created_at?: string;
  updated_at?: string;
};

export type StudentWithRank = StudentPublicScore & {
  rank: number;
};

export type ScoreBand = "all" | "90+" | "80-89" | "70-79" | "60-69" | "below-60";

export type LeaderboardSortKey =
  | "rank"
  | "name"
  | "total"
  | "coding"
  | "quantitative_aptitude"
  | "logical_reasoning"
  | "verbal_ability"
  | "computer_fundamentals"
  | "pseudocode_debugging";

export type ImportHistoryRecord = {
  id: string;
  filename: string;
  uploaded_at: string;
  student_count: number;
  status: "processing" | "success" | "failed";
  error_count: number;
  warning_count: number;
  raw_entries: number;
  unique_students: number;
  multiple_entry_records: number;
  identity_conflict_records: number;
};

export type DuplicateType = "EXACT_DUPLICATE" | "MULTIPLE_ENTRY" | "IDENTITY_CONFLICT";

export type DuplicateReason =
  | "duplicate_prn"
  | "duplicate_email"
  | "duplicate_phone"
  | "duplicate_prn_email"
  | "duplicate_prn_phone"
  | "duplicate_email_phone"
  | "duplicate_prn_email_phone";

export type ImportPayloadRow = {
  name: string;
  mobile: string | null;
  email: string | null;
  prn: string;
  branch: string;
  division: string;
  computer_fundamentals: number;
  quantitative_aptitude: number;
  logical_reasoning: number;
  verbal_ability: number;
  pseudocode_debugging: number;
  coding: number;
  excel_total: number;
  calculated_total: number;
  total: number;
  duplicate: boolean;
  duplicate_type: DuplicateType | null;
  duplicate_reasons: DuplicateReason[];
  related_rows: number[];
  source_row: number;
};

export type ValidationIssue = {
  type: "error" | "warning";
  code: string;
  title: string;
  message: string;
  row?: number;
  details?: string[];
  relatedRows?: number[];
  blocking?: boolean;
};

export type ImportValidationSummary = {
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