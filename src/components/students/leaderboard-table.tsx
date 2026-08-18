"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  LeaderboardSortKey,
  ScoreBand,
  StudentWithRank,
} from "@/types/student";

import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  FilterBar,
  type StudentFilterState,
} from "@/components/students/filter-bar";

function passesScoreBand(total: number, band: ScoreBand) {
  if (band === "all") return true;

  if (band === "90+") {
    return total >= 90;
  }

  if (band === "80-89") {
    return total >= 80 && total < 90;
  }

  if (band === "70-79") {
    return total >= 70 && total < 80;
  }

  if (band === "60-69") {
    return total >= 60 && total < 70;
  }

  return total < 60;
}

function sortRows(
  rows: StudentWithRank[],
  sortKey: LeaderboardSortKey,
) {
  const sorted = [...rows];

  if (sortKey === "name") {
    sorted.sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    return sorted;
  }

  if (sortKey === "rank") {
    sorted.sort(
      (a, b) =>
        a.rank - b.rank ||
        a.name.localeCompare(b.name),
    );

    return sorted;
  }

  sorted.sort((a, b) => {
    const aValue =
      a[sortKey as keyof StudentWithRank];

    const bValue =
      b[sortKey as keyof StudentWithRank];

    return Number(bValue) - Number(aValue);
  });

  return sorted;
}

export function LeaderboardTable({
  students,
  isAllTime,
}: {
  students: StudentWithRank[];
  isAllTime: boolean;
}) {
  const [page, setPage] = useState(1);

  const [filters, setFilters] =
    useState<StudentFilterState>({
      query: "",
      branch: "All",
      division: "All",
      scoreBand: "all",
      sortKey: "rank",
    });

  const pageSize = 20;

  const branches = useMemo(
    () =>
      Array.from(
        new Set(
          students.map(
            (student) => student.branch,
          ),
        ),
      ).sort(),
    [students],
  );

  const divisions = useMemo(
    () =>
      Array.from(
        new Set(
          students.map(
            (student) => student.division,
          ),
        ),
      ).sort(),
    [students],
  );

  const filteredRows = useMemo(() => {
    const filtered = students.filter(
      (student) => {
        const matchesQuery =
          student.name
            .toLowerCase()
            .includes(
              filters.query
                .trim()
                .toLowerCase(),
            );

        const matchesBranch =
          filters.branch === "All" ||
          student.branch ===
            filters.branch;

        const matchesDivision =
          filters.division === "All" ||
          student.division ===
            filters.division;

        const matchesBand =
          passesScoreBand(
            student.total,
            filters.scoreBand,
          );

        return (
          matchesQuery &&
          matchesBranch &&
          matchesDivision &&
          matchesBand
        );
      },
    );

    return sortRows(
      filtered,
      filters.sortKey,
    );
  }, [students, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRows.length / pageSize,
    ),
  );

  const clampedPage = Math.min(
    page,
    totalPages,
  );

  const pageRows =
    filteredRows.slice(
      (clampedPage - 1) * pageSize,
      clampedPage * pageSize,
    );

  return (
    <div className="space-y-3">
      <FilterBar
        value={filters}
        branches={branches}
        divisions={divisions}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />

      {pageRows.length === 0 ? (
        <EmptyState
          title="No students found"
          description="Try changing your filters or search query."
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
          <div className="max-h-[70vh] overflow-auto">
            <Table>
              <thead className="sticky top-0 z-10">
                <tr>
                  <TableHead>
                    Rank
                  </TableHead>

                  <TableHead>
                    Student
                  </TableHead>

                  <TableHead>
                    Branch
                  </TableHead>

                  <TableHead>
                    Division
                  </TableHead>

                  <TableHead className="text-right">
                    Total
                  </TableHead>

                  <TableHead className="text-right">
                    Coding
                  </TableHead>

                  <TableHead className="text-right">
                    Quant
                  </TableHead>

                  <TableHead className="text-right">
                    Logical
                  </TableHead>

                  <TableHead className="text-right">
                    Verbal
                  </TableHead>

                  <TableHead className="text-right">
                    CF
                  </TableHead>

                  <TableHead className="text-right">
                    Pseudo
                  </TableHead>
                </tr>
              </thead>

              <tbody>
                {pageRows.map((student) => (
                  <TableRow
                    key={`${student.student_id}-${student.import_id ?? student.rank}`}
                  >
                    {/* Rank */}
                    <TableCell className="font-medium text-zinc-900">
                      #{student.rank}
                    </TableCell>

                    {/* Student */}
                    <TableCell>
                      <Link
                        href={`/students/${student.student_id}`}
                        className="hover:underline"
                      >
                        {student.name}
                      </Link>
                    </TableCell>

                    {/* Branch */}
                    <TableCell>
                      {student.branch}
                    </TableCell>

                    {/* Division */}
                    <TableCell>
                      {student.division}
                    </TableCell>

                    {/* Total */}
                    <TableCell className="text-right font-medium text-zinc-900">
                      {isAllTime
                        ? `${student.total.toFixed(2)}%`
                        : student.total.toFixed(2)}
                    </TableCell>

                    {/* Coding */}
                    <TableCell className="text-right">
                      {isAllTime
                        ? `${student.coding.toFixed(2)}%`
                        : student.coding.toFixed(2)}
                    </TableCell>

                    {/* Quant */}
                    <TableCell className="text-right">
                      {isAllTime
                        ? `${student.quantitative_aptitude.toFixed(2)}%`
                        : student.quantitative_aptitude.toFixed(2)}
                    </TableCell>

                    {/* Logical */}
                    <TableCell className="text-right">
                      {isAllTime
                        ? `${student.logical_reasoning.toFixed(2)}%`
                        : student.logical_reasoning.toFixed(2)}
                    </TableCell>

                    {/* Verbal */}
                    <TableCell className="text-right">
                      {isAllTime
                        ? `${student.verbal_ability.toFixed(2)}%`
                        : student.verbal_ability.toFixed(2)}
                    </TableCell>

                    {/* Computer Fundamentals */}
                    <TableCell className="text-right">
                      {isAllTime
                        ? `${student.computer_fundamentals.toFixed(2)}%`
                        : student.computer_fundamentals.toFixed(2)}
                    </TableCell>

                    {/* Pseudocode */}
                    <TableCell className="text-right">
                      {isAllTime
                        ? `${student.pseudocode_debugging.toFixed(2)}%`
                        : student.pseudocode_debugging.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 px-3 py-2">
            <p className="text-xs text-zinc-500">
              Showing{" "}
              {(clampedPage - 1) *
                pageSize +
                1}{" "}
              to{" "}
              {Math.min(
                clampedPage * pageSize,
                filteredRows.length,
              )}{" "}
              of {filteredRows.length}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={clampedPage <= 1}
                onClick={() =>
                  setPage((p) => p - 1)
                }
              >
                Previous
              </Button>

              <span className="text-xs text-zinc-500">
                Page {clampedPage} /{" "}
                {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={
                  clampedPage >= totalPages
                }
                onClick={() =>
                  setPage((p) => p + 1)
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}