import { createServerSupabaseClient } from "@/lib/supabase/server";

import { addDenseRanks } from "@/lib/ranking";

import {
  average,
  groupedBy,
  groupedByDivision,
  groupedByBranchAndDivision,
  median,
  pearsonCorrelation,
  scoreHistogram,
  standardDeviation,
  subjectAverages,
} from "@/lib/analytics";

import type {
  ImportHistoryRecord,
  StudentPublicScore,
  StudentWithRank,
} from "@/types/student";


/*
 * Get students for a specific test.
 *
 * importId:
 *   undefined / "all" -> all available score records
 *   specific UUID     -> only that test
 */
export async function getPublicStudents(
  importId?: string,
): Promise<StudentWithRank[]> {
  const supabase = await createServerSupabaseClient();

  if (importId && importId !== "all") {
    const { data, error } = await supabase
      .from("student_public_scores")
      .select("*")
      .eq("import_id", importId)
      .order("total", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error(
        "[data] getPublicStudents individual test error:",
        error,
      );

      return [];
    }

    return addDenseRanks(
      (data ?? []) as StudentPublicScore[],
    );
  }

  const { data: scoreData, error: scoreError } =
    await supabase
      .from("student_public_scores")
      .select("*");

  if (scoreError) {
    console.error(
      "[data] getPublicStudents all-time score error:",
      scoreError,
    );

    return [];
  }

  const rows =
    (scoreData ?? []) as StudentPublicScore[];

  if (rows.length === 0) {
    return [];
  }

  const importIds = [
    ...new Set(
      rows.map((row) => row.import_id),
    ),
  ];

  const { data: importData, error: importError } =
    await supabase
      .from("imports")
      .select(
        "id, test_name, max_scores",
      )
      .in("id", importIds)
      .eq("status", "success");

  if (importError) {
    console.error(
      "[data] getPublicStudents all-time imports error:",
      importError,
    );

    return [];
  }

  type MaxScores = {
    computer_fundamentals: number;
    quantitative_aptitude: number;
    logical_reasoning: number;
    verbal_ability: number;
    pseudocode_debugging: number;
    coding: number;
  };

  type ImportInfo = {
    id: string;
    test_name: string | null;
    max_scores: MaxScores | null;
  };

  const importsMap =
    new Map<string, ImportInfo>();

  for (const item of importData ?? []) {
    importsMap.set(
      item.id,
      item as ImportInfo,
    );
  }

  type AllTimeStudent = {
    id: string;
    student_id: string;

    name: string;
    branch: string;
    division: string;

    computer_fundamentals_obtained: number;
    computer_fundamentals_max: number;

    quantitative_aptitude_obtained: number;
    quantitative_aptitude_max: number;

    logical_reasoning_obtained: number;
    logical_reasoning_max: number;

    verbal_ability_obtained: number;
    verbal_ability_max: number;

    pseudocode_debugging_obtained: number;
    pseudocode_debugging_max: number;

    coding_obtained: number;
    coding_max: number;

    total_obtained: number;
    total_max: number;

    has_multiple_entries: boolean;
  };

  const studentMap =
    new Map<string, AllTimeStudent>();

  for (const row of rows) {
    const testInfo =
      importsMap.get(row.import_id);

    if (!testInfo) {
      continue;
    }

    const maxScores =
      testInfo.max_scores;

    if (!maxScores) {
      console.warn(
        `[data] Missing max_scores for import ${row.import_id}`,
      );

      continue;
    }

    const studentId = row.student_id;

    let student =
      studentMap.get(studentId);

    if (!student) {
      student = {
        id: row.id,
        student_id: studentId,

        name: row.name,
        branch: row.branch,
        division: row.division,

        computer_fundamentals_obtained: 0,
        computer_fundamentals_max: 0,

        quantitative_aptitude_obtained: 0,
        quantitative_aptitude_max: 0,

        logical_reasoning_obtained: 0,
        logical_reasoning_max: 0,

        verbal_ability_obtained: 0,
        verbal_ability_max: 0,

        pseudocode_debugging_obtained: 0,
        pseudocode_debugging_max: 0,

        coding_obtained: 0,
        coding_max: 0,

        total_obtained: 0,
        total_max: 0,

        has_multiple_entries:
          Boolean(row.has_multiple_entries),
      };

      studentMap.set(
        studentId,
        student,
      );
    }

    student.computer_fundamentals_obtained +=
      Number(row.computer_fundamentals) || 0;

    student.computer_fundamentals_max +=
      Number(maxScores.computer_fundamentals) || 0;

    student.quantitative_aptitude_obtained +=
      Number(row.quantitative_aptitude) || 0;

    student.quantitative_aptitude_max +=
      Number(maxScores.quantitative_aptitude) || 0;

    student.logical_reasoning_obtained +=
      Number(row.logical_reasoning) || 0;

    student.logical_reasoning_max +=
      Number(maxScores.logical_reasoning) || 0;

    student.verbal_ability_obtained +=
      Number(row.verbal_ability) || 0;

    student.verbal_ability_max +=
      Number(maxScores.verbal_ability) || 0;

    student.pseudocode_debugging_obtained +=
      Number(row.pseudocode_debugging) || 0;

    student.pseudocode_debugging_max +=
      Number(maxScores.pseudocode_debugging) || 0;

    student.coding_obtained +=
      Number(row.coding) || 0;

    student.coding_max +=
      Number(maxScores.coding) || 0;

    student.total_obtained +=
      Number(row.total) || 0;

    student.total_max +=
      Object.values(maxScores).reduce(
        (sum, value) =>
          sum + (Number(value) || 0),
        0,
      );

    student.has_multiple_entries =
      student.has_multiple_entries ||
      Boolean(row.has_multiple_entries);
  }

  const percentage = (
    obtained: number,
    maximum: number,
  ): number => {
    if (maximum <= 0) {
      return 0;
    }

    return (obtained / maximum) * 100;
  };

  const allTimeStudents: StudentPublicScore[] =
    Array.from(studentMap.values()).map(
      (student) => ({
        id: student.id,
        student_id: student.student_id,
        import_id: "all",

        name: student.name,
        branch: student.branch,
        division: student.division,

        computer_fundamentals:
          percentage(
            student.computer_fundamentals_obtained,
            student.computer_fundamentals_max,
          ),

        quantitative_aptitude:
          percentage(
            student.quantitative_aptitude_obtained,
            student.quantitative_aptitude_max,
          ),

        logical_reasoning:
          percentage(
            student.logical_reasoning_obtained,
            student.logical_reasoning_max,
          ),

        verbal_ability:
          percentage(
            student.verbal_ability_obtained,
            student.verbal_ability_max,
          ),

        pseudocode_debugging:
          percentage(
            student.pseudocode_debugging_obtained,
            student.pseudocode_debugging_max,
          ),

        coding:
          percentage(
            student.coding_obtained,
            student.coding_max,
          ),

        total:
          percentage(
            student.total_obtained,
            student.total_max,
          ),

        has_multiple_entries:
          student.has_multiple_entries,

        duplicate_type: null,
      }),
    );

  // ← FIX: this return + closing brace were missing
  return addDenseRanks(allTimeStudents);
}


/*
 * Get one student from the currently selected test.
 */
export async function getPublicStudentById(
  id: string,
  importId?: string,
): Promise<StudentWithRank | null> {
  const students = await getPublicStudents(importId);

  return (
    students.find(
      (student) => student.student_id === id,
    ) ?? null
  );
}


/*
 * Get all successful test/imports.
 */
export async function getAvailableTests() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("imports")
    .select(
      "id, filename, test_name, max_scores, uploaded_at, status",
    )
    .eq("status", "success")
    .order("uploaded_at", {
      ascending: true,
    });

  if (error) {
    console.error(
      "[data] getAvailableTests error:",
      error,
    );

    return [];
  }

  return data ?? [];
}

export async function getTestInfo(
  importId: string,
) {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("imports")
      .select(
        "id, test_name, filename, max_scores",
      )
      .eq("id", importId)
      .eq("status", "success")
      .maybeSingle();

  if (error) {
    console.error(
      "[data] getTestInfo error:",
      error,
    );

    return null;
  }

  return data;
}

/*
 * Overview metrics.
 */
export async function getOverviewMetrics(
  importId?: string,
) {
  const students = await getPublicStudents(importId);

  const totals = students.map(
    (student) => student.total,
  );

  return {
    totalStudents: students.length,

    averageScore: average(totals),

    highestScore: totals.length
      ? Math.max(...totals)
      : 0,

    lowestScore: totals.length
      ? Math.min(...totals)
      : 0,

    avgCoding: average(
      students.map(
        (student) => student.coding,
      ),
    ),

    avgLogicalReasoning: average(
      students.map(
        (student) =>
          student.logical_reasoning,
      ),
    ),

    avgQuantitativeAptitude: average(
      students.map(
        (student) =>
          student.quantitative_aptitude,
      ),
    ),
  };
}


/*
 * Dashboard analytics.
 */
export async function getDashboardAnalytics(
  importId?: string,
) {
  const students =
    await getPublicStudents(importId);

  let histogram;

  if (!importId || importId === "all") {
    histogram = scoreHistogram(students);
  } else {
    const testInfo =
      await getTestInfo(importId);

    const maxScores =
      testInfo?.max_scores as
        | {
            computer_fundamentals: number;
            quantitative_aptitude: number;
            logical_reasoning: number;
            verbal_ability: number;
            pseudocode_debugging: number;
            coding: number;
          }
        | null
        | undefined;

    if (maxScores) {
      const maxTotal =
        Number(maxScores.computer_fundamentals) +
        Number(maxScores.quantitative_aptitude) +
        Number(maxScores.logical_reasoning) +
        Number(maxScores.verbal_ability) +
        Number(maxScores.pseudocode_debugging) +
        Number(maxScores.coding);

      const percentageStudents =
        students.map((student) => ({
          ...student,
          total:
            maxTotal > 0
              ? (Number(student.total) / maxTotal) * 100
              : 0,
        }));

      histogram =
        scoreHistogram(
          percentageStudents,
        );
    } else {
      histogram =
        scoreHistogram([]);
    }
  }

  return {
    students,

    histogram,

    subjectAverages:
      subjectAverages(students),

    branchAverages:
      groupedBy(
        students,
        "branch",
      ),

    divisionAverages:
      groupedByDivision(
        students,
      ),
  };
}


/*
 * Detailed analytics.
 */
export async function getDetailedAnalytics(
  importId?: string,
) {
  const students =
    await getPublicStudents(importId);

  const totals = students.map(
    (student) => student.total,
  );

  return {
    overall: {
      average: average(totals),

      median: median(totals),

      highest: totals.length
        ? Math.max(...totals)
        : 0,

      lowest: totals.length
        ? Math.min(...totals)
        : 0,

      standardDeviation:
        standardDeviation(totals),
    },

    subjects:
      subjectAverages(students).map(
        (subject) => {
          const values = students.map(
            (student) =>
              student[subject.key],
          );

          return {
            subject: subject.subject,

            average: average(values),

            highest: values.length
              ? Math.max(...values)
              : 0,

            lowest: values.length
              ? Math.min(...values)
              : 0,

            median: median(values),
          };
        },
      ),

    branchStats:
      groupedBy(students, "branch"),

    divisionStats:
      groupedByBranchAndDivision(students),

    correlations: {
      codingVsTotal:
        pearsonCorrelation(
          students.map(
            (student) =>
              student.coding,
          ),
          totals,
        ),

      quantitativeVsTotal:
        pearsonCorrelation(
          students.map(
            (student) =>
              student.quantitative_aptitude,
          ),
          totals,
        ),

      logicalVsTotal:
        pearsonCorrelation(
          students.map(
            (student) =>
              student.logical_reasoning,
          ),
          totals,
        ),
    },
  };
}


/*
 * Import history.
 */
export async function getImportHistory(
  limit = 10,
): Promise<ImportHistoryRecord[]> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("imports")
      .select(
        "id, filename, test_name, max_scores, uploaded_at, student_count, status, error_count, warning_count, raw_entries, unique_students, multiple_entry_records, identity_conflict_records",
      )
      .order("uploaded_at", {
        ascending: false,
      })
      .limit(limit);

  if (error) {
    console.error(
      "[data] getImportHistory error:",
      error,
    );

    return [];
  }

  return (data ?? []) as ImportHistoryRecord[];
}

export type StudentTestResult = {
  importId: string;
  testName: string;
  filename: string;
  uploadedAt: string;

  computer_fundamentals: number;
  quantitative_aptitude: number;
  logical_reasoning: number;
  verbal_ability: number;
  pseudocode_debugging: number;
  coding: number;
  total: number;

  maxScores: {
    computer_fundamentals: number;
    quantitative_aptitude: number;
    logical_reasoning: number;
    verbal_ability: number;
    pseudocode_debugging: number;
    coding: number;
  };

  maxTotal: number;
  percentage: number;
};

export async function getStudentTestHistory(
  studentId: string,
): Promise<StudentTestResult[]> {
  const supabase = await createServerSupabaseClient();

  const { data: scores, error: scoresError } =
    await supabase
      .from("student_public_scores")
      .select(
        `
          import_id,
          computer_fundamentals,
          quantitative_aptitude,
          logical_reasoning,
          verbal_ability,
          pseudocode_debugging,
          coding,
          total
        `,
      )
      .eq("student_id", studentId);

  if (scoresError || !scores) {
    console.error(
      "[data] getStudentTestHistory scores error:",
      scoresError,
    );
    return [];
  }

  const importIds = [
    ...new Set(
      scores.map((score) => score.import_id),
    ),
  ];

  if (importIds.length === 0) {
    return [];
  }

  const { data: imports, error: importsError } =
    await supabase
      .from("imports")
      .select(
        "id, filename, test_name, max_scores, uploaded_at, status",
      )
      .in("id", importIds)
      .eq("status", "success");

  if (importsError || !imports) {
    console.error(
      "[data] getStudentTestHistory imports error:",
      importsError,
    );
    return [];
  }

  const importMap = new Map(
    imports.map((item) => [
      item.id,
      item,
    ]),
  );

  return scores
    .map((score) => {
      const test = importMap.get(
        score.import_id,
      );

      if (!test || !test.max_scores) {
        return null;
      }

      const maxScores =
        test.max_scores as StudentTestResult["maxScores"];

      const maxTotal =
        Number(maxScores.computer_fundamentals) +
        Number(maxScores.quantitative_aptitude) +
        Number(maxScores.logical_reasoning) +
        Number(maxScores.verbal_ability) +
        Number(maxScores.pseudocode_debugging) +
        Number(maxScores.coding);

      const total = Number(score.total);

      return {
        importId: test.id,
        testName: test.test_name,
        filename: test.filename,
        uploadedAt: test.uploaded_at,

        computer_fundamentals:
          Number(score.computer_fundamentals),

        quantitative_aptitude:
          Number(score.quantitative_aptitude),

        logical_reasoning:
          Number(score.logical_reasoning),

        verbal_ability:
          Number(score.verbal_ability),

        pseudocode_debugging:
          Number(score.pseudocode_debugging),

        coding:
          Number(score.coding),

        total,

        maxScores,

        maxTotal,

        percentage:
          maxTotal > 0
            ? (total / maxTotal) * 100
            : 0,
      };
    })
    .filter(
      (
        result,
      ): result is StudentTestResult =>
        result !== null,
    )
    .sort(
      (a, b) =>
        new Date(a.uploadedAt).getTime() -
        new Date(b.uploadedAt).getTime(),
    );
}