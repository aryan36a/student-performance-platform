import type {
  StudentPublicScore,
  StudentWithRank,
} from "@/types/student";

function rankRows(rows: StudentPublicScore[]): StudentWithRank[] {
  const sorted = [...rows].sort(
    (a, b) =>
      b.total - a.total ||
      a.name.localeCompare(b.name),
  );

  let currentRank = 0;
  let previousScore: number | null = null;

  return sorted.map((row) => {
    if (
      previousScore === null ||
      row.total < previousScore
    ) {
      currentRank += 1;
      previousScore = row.total;
    }

    return {
      ...row,
      rank: currentRank,
    };
  });
}

export function addDenseRanks(
  rows: StudentPublicScore[],
): StudentWithRank[] {
  return rankRows(rows);
}

export function getRank(
  rows: StudentPublicScore[],
  studentId: string,
): number {
  const ranked = rankRows(rows);

  return (
    ranked.find(
      (row) => row.student_id === studentId,
    )?.rank ?? 0
  );
}