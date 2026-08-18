"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ImportHistoryRecord } from "@/types/student";

export function ImportHistory({
  rows,
}: {
  rows: ImportHistoryRecord[];
}) {
  const router = useRouter();

  const [deletingId, setDeletingId] = useState<string | null>(
    null,
  );

  const [deletingAll, setDeletingAll] = useState(false);

  async function deleteImport(importId: string) {
    const confirmed = window.confirm(
      "Delete this import?\n\nAll scores associated with this test will be permanently deleted.",
    );

    if (!confirmed) return;

    setDeletingId(importId);

    try {
      const response = await fetch(
        "/api/admin/import/delete",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            importId,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        window.alert(
          result.error ?? "Failed to delete import.",
        );
        return;
      }

      router.refresh();
    } catch {
      window.alert("Failed to delete import.");
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteAllImports() {
    const confirmed = window.confirm(
      "Delete ALL imports?\n\nThis will permanently delete every test, every score, and all student data.\n\nThis cannot be undone.",
    );

    if (!confirmed) return;

    setDeletingAll(true);

    try {
      const response = await fetch(
        "/api/admin/import/delete",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deleteAll: true,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        window.alert(
          result.error ?? "Failed to delete imports.",
        );
        return;
      }

      router.refresh();
    } catch {
      window.alert("Failed to delete imports.");
    } finally {
      setDeletingAll(false);
    }
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-900">
          Import History
        </h3>

        {rows.length > 0 && (
          <button
            type="button"
            onClick={deleteAllImports}
            disabled={deletingAll || deletingId !== null}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletingAll
              ? "Deleting..."
              : "Delete All Imports"}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
              <th className="px-3 py-2 text-left font-medium">
                Filename
              </th>

              <th className="px-3 py-2 text-left font-medium">
                Date
              </th>

              <th className="px-3 py-2 text-right font-medium">
                Raw Entries
              </th>

              <th className="px-3 py-2 text-right font-medium">
                Unique Students
              </th>

              <th className="px-3 py-2 text-right font-medium">
                Multiple Entry
              </th>

              <th className="px-3 py-2 text-right font-medium">
                Identity Conflicts
              </th>

              <th className="px-3 py-2 text-left font-medium">
                Status
              </th>

              <th className="px-3 py-2 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-zinc-100"
              >
                <td className="px-3 py-2">
                  {row.filename}
                </td>

                <td className="whitespace-nowrap px-3 py-2">
                  {format(
                    new Date(row.uploaded_at),
                    "MMM dd, yyyy HH:mm",
                  )}
                </td>

                <td className="px-3 py-2 text-right">
                  {row.raw_entries > 0
                    ? row.raw_entries
                    : row.student_count}
                </td>

                <td className="px-3 py-2 text-right">
                  {row.unique_students > 0
                    ? row.unique_students
                    : "—"}
                </td>

                <td className="px-3 py-2 text-right">
                  {row.multiple_entry_records > 0 ? (
                    <span className="text-amber-700">
                      {row.multiple_entry_records}
                    </span>
                  ) : (
                    "0"
                  )}
                </td>

                <td className="px-3 py-2 text-right">
                  {row.identity_conflict_records > 0 ? (
                    <span className="text-red-700">
                      {row.identity_conflict_records}
                    </span>
                  ) : (
                    "0"
                  )}
                </td>

                <td className="px-3 py-2">
                  <span
                    className={
                      row.status === "success"
                        ? "text-emerald-700"
                        : row.status === "failed"
                          ? "text-red-700"
                          : "text-amber-700"
                    }
                  >
                    {row.status}
                  </span>
                </td>

                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      deleteImport(row.id)
                    }
                    disabled={
                      deletingAll ||
                      deletingId === row.id
                    }
                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === row.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-sm text-zinc-500"
                >
                  No imports found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}