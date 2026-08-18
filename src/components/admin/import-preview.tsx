import type { ImportPayloadRow } from "@/types/student";

function statusLabel(row: ImportPayloadRow) {
  if (!row.duplicate) return null;

  if (row.duplicate_type === "EXACT_DUPLICATE") {
    return "Exact duplicate";
  }

  if (row.duplicate_type === "MULTIPLE_ENTRY") {
    return "Multiple entry";
  }

  return "Possible identity conflict";
}

function statusClass(row: ImportPayloadRow) {
  if (!row.duplicate) return "text-zinc-400";

  if (row.duplicate_type === "MULTIPLE_ENTRY" || row.duplicate_type === "EXACT_DUPLICATE") {
    return "font-medium text-amber-700";
  }

  return "font-medium text-orange-700";
}

export function ImportPreview({ rows }: { rows: ImportPayloadRow[] }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-3 py-2">
        <div>
          <p className="text-sm font-medium text-zinc-800">Import Preview</p>
          <p className="text-xs text-zinc-500">
            Showing all {rows.length} parsed records. Scroll to review the full dataset.
          </p>
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto">
        <table className="w-full min-w-[920px] text-xs">
          <thead className="sticky top-0 z-10 bg-zinc-50 text-zinc-600 shadow-sm">
            <tr>
              <th className="px-2 py-2 text-left">Row</th>
              <th className="px-2 py-2 text-left">Name</th>
              <th className="px-2 py-2 text-left">Branch</th>
              <th className="px-2 py-2 text-left">Division</th>
              <th className="px-2 py-2 text-left">PRN</th>
              <th className="px-2 py-2 text-right">Excel Total</th>
              <th className="px-2 py-2 text-right">Calculated Total</th>
              <th className="px-2 py-2 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => {
              const totalMismatch = row.excel_total !== row.calculated_total;
              const status = statusLabel(row);

              return (
                <tr
                  key={`${row.source_row}-${row.prn}-${idx}`}
                  className={
                    totalMismatch
                      ? "border-b border-red-100 bg-red-50/60"
                      : row.duplicate
                        ? "border-b border-amber-100 bg-amber-50/30"
                        : "border-b border-zinc-100"
                  }
                >
                  <td className="px-2 py-2 text-zinc-500">{row.source_row}</td>
                  <td className="px-2 py-2 font-medium text-zinc-900">{row.name}</td>
                  <td className="px-2 py-2">{row.branch}</td>
                  <td className="px-2 py-2">{row.division}</td>
                  <td className="px-2 py-2">{row.prn}</td>
                  <td
                    className={`px-2 py-2 text-right ${
                      totalMismatch ? "font-semibold text-red-700" : ""
                    }`}
                  >
                    {row.excel_total}
                  </td>
                  <td
                    className={`px-2 py-2 text-right font-semibold ${
                      totalMismatch ? "text-red-700" : "text-zinc-900"
                    }`}
                  >
                    {row.calculated_total}
                  </td>
                  <td className={`px-2 py-2 ${statusClass(row)}`}>
                    {totalMismatch ? "Total mismatch" : status ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}