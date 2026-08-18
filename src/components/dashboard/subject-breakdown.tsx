import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SubjectRow = {
  subject: string;
  average: number;
  median: number;
  highest: number;
  lowest: number;
};

export function SubjectBreakdown({
  rows,
  isAllTime,
}: {
  rows: SubjectRow[];
  isAllTime: boolean;
}) {
  function formatValue(value: number) {
    return `${value.toFixed(2)}${isAllTime ? "%" : ""}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject Analysis</CardTitle>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="py-2 text-left font-medium">
                Subject
              </th>

              <th className="py-2 text-right font-medium">
                Average
              </th>

              <th className="py-2 text-right font-medium">
                Median
              </th>

              <th className="py-2 text-right font-medium">
                Highest
              </th>

              <th className="py-2 text-right font-medium">
                Lowest
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={row.subject}
                className="border-b border-zinc-100"
              >
                <td className="py-2">
                  {row.subject}
                </td>

                <td className="py-2 text-right">
                  {formatValue(row.average)}
                </td>

                <td className="py-2 text-right">
                  {formatValue(row.median)}
                </td>

                <td className="py-2 text-right">
                  {formatValue(row.highest)}
                </td>

                <td className="py-2 text-right">
                  {formatValue(row.lowest)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}