"use client";
import { TOTAL_MAX_SCORE } from "@/lib/constants";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { FilterBar, type StudentFilterState } from "@/components/students/filter-bar";
import type { StudentWithRank } from "@/types/student";

export function StudentDirectoryTable({ students }: { students: StudentWithRank[] }) {
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);
  const [filters, setFilters] = useState<StudentFilterState>({
    query: "",
    branch: "All",
    division: "All",
    scoreBand: "all",
    sortKey: "rank",
  });
  const router = useRouter();

  const branches = useMemo(() => Array.from(new Set(students.map((student) => student.branch))).sort(), [students]);
  const divisions = useMemo(() => {
  const branchStudents =
    filters.branch === "All"
      ? students
      : students.filter(
          (student) => student.branch === filters.branch,
        );

  return Array.from(
    new Set(branchStudents.map((student) => student.division)),
  ).sort();
}, [students, filters.branch]);

const filtered = useMemo(() => {
  const rows = students.filter((student) => {
    const nameOk = student.name
      .toLowerCase()
      .includes(filters.query.trim().toLowerCase());

    const branchOk =
      filters.branch === "All" ||
      student.branch === filters.branch;

    const divisionOk =
      filters.division === "All" ||
      student.division === filters.division;

    const percentage =
      (student.total / TOTAL_MAX_SCORE) * 100;

    const bandOk =
      filters.scoreBand === "all" ||
      (filters.scoreBand === "90+" && percentage >= 90) ||
      (filters.scoreBand === "80-89" &&
        percentage >= 80 &&
        percentage < 90) ||
      (filters.scoreBand === "70-79" &&
        percentage >= 70 &&
        percentage < 80) ||
      (filters.scoreBand === "60-69" &&
        percentage >= 60 &&
        percentage < 70) ||
      (filters.scoreBand === "below-60" && percentage < 60);

    return nameOk && branchOk && divisionOk && bandOk;
  });

  if (filters.sortKey === "name") {
    return rows.sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  if (filters.sortKey === "rank") {
    return rows.sort(
      (a, b) =>
        a.rank - b.rank ||
        a.name.localeCompare(b.name),
    );
  }

  return rows.sort((a, b) => {
    const aValue =
      a[filters.sortKey as keyof StudentWithRank];
    const bValue =
      b[filters.sortKey as keyof StudentWithRank];

    return Number(bValue) - Number(aValue);
  });
}, [students, filters]);

  const columns = useMemo<ColumnDef<StudentWithRank>[]>(
    () => [
      {
        accessorKey: "rank",
        header: "Rank",
        cell: ({ row }) => <span className="font-medium text-zinc-900">#{row.original.rank}</span>,
      },
      { accessorKey: "name",
  header: "Name",
  cell: ({ row }) => (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-zinc-900">
        {row.original.name}
      </span>

      {row.original.has_multiple_entries && (
        <span className="inline-flex w-fit items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
          ⚠ Multiple entries
        </span>
      )}
    </div>
  ), },
      {
        accessorKey: "branch",
        header: "Branch",
        cell: ({ row }) => <Badge>{row.original.branch}</Badge>,
      },
      { accessorKey: "division", header: "Division" },
      {
        accessorKey: "total",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => <div className="text-right font-semibold text-zinc-900">{row.original.total}</div>,
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next as { id: string; desc: boolean }[]);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-3">
      <FilterBar
        value={filters}
        branches={branches}
        divisions={divisions}
        onChange={(next) => {
  const branchChanged = next.branch !== filters.branch;

  const updatedFilters = {
    ...next,
    division: branchChanged ? "All" : next.division,
  };

  setFilters(updatedFilters);
  table.setPageIndex(0);
}}
      />

      {filtered.length === 0 ? (
        <EmptyState title="No students found" description="Try changing your filters or search query." />
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
          <div className="max-h-[72vh] overflow-auto">
            <Table>
              <thead className="sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/students/${row.original.student_id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-200 p-3">
            <span className="text-xs text-zinc-500">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
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
