import { SiteHeader } from "@/components/layout/site-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SubjectBreakdown } from "@/components/dashboard/subject-breakdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDetailedAnalytics } from "@/lib/data";

export const revalidate = 60;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    test?: string;
  }>;
}) {
  const params = await searchParams;

  const isAllTime =
    !params.test || params.test === "all";

  const analytics = await getDetailedAnalytics(
    params.test,
  );

  const formatScore = (value: number) =>
    isAllTime
      ? `${value.toFixed(2)}%`
      : value.toFixed(2);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6 sm:px-6 lg:px-8">

        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Analytics
        </h1>

        {/* Overall metrics */}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

          <MetricCard
            label="Average Score"
            value={formatScore(analytics.overall.average)}
          />

          <MetricCard
            label="Median Score"
            value={formatScore(analytics.overall.median)}
          />

          <MetricCard
            label="Highest Score"
            value={formatScore(analytics.overall.highest)}
          />

          <MetricCard
            label="Lowest Score"
            value={formatScore(analytics.overall.lowest)}
          />

          <MetricCard
            label="Std Deviation"
            value={formatScore(
              analytics.overall.standardDeviation,
            )}
          />

        </section>

        {/* Subject analysis */}

        <SubjectBreakdown
          rows={analytics.subjects}
          isAllTime={isAllTime}
        />

        {/* Branch / Division */}

        <section className="grid gap-4 lg:grid-cols-2">

          <Card>
            <CardHeader>
              <CardTitle>Branch Analysis</CardTitle>
            </CardHeader>

            <CardContent className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500">
                    <th className="py-2 text-left font-medium">
                      Branch
                    </th>

                    <th className="py-2 text-right font-medium">
                      Count
                    </th>

                    <th className="py-2 text-right font-medium">
                      Average
                    </th>

                    <th className="py-2 text-right font-medium">
                      Highest
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {analytics.branchStats.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-zinc-100"
                    >
                      <td className="py-2">
                        {row.label}
                      </td>

                      <td className="py-2 text-right">
                        {row.count}
                      </td>

                      <td className="py-2 text-right">
                        {formatScore(row.average)}
                      </td>

                      <td className="py-2 text-right">
                        {formatScore(row.highest)}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Division Analysis</CardTitle>
            </CardHeader>

            <CardContent className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500">
                    <th className="py-2 text-left font-medium">
                      Division
                    </th>

                    <th className="py-2 text-right font-medium">
                      Count
                    </th>

                    <th className="py-2 text-right font-medium">
                      Average
                    </th>

                    <th className="py-2 text-right font-medium">
                      Highest
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {analytics.divisionStats.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-zinc-100"
                    >
                      <td className="py-2">
                        {row.label}
                      </td>

                      <td className="py-2 text-right">
                        {row.count}
                      </td>

                      <td className="py-2 text-right">
                        {formatScore(row.average)}
                      </td>

                      <td className="py-2 text-right">
                        {formatScore(row.highest)}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </CardContent>
          </Card>

        </section>

        {/* Correlations */}

        <section className="grid gap-3 sm:grid-cols-3">

          <MetricCard
            label="Correlation: Coding vs Total"
            value={analytics.correlations.codingVsTotal.toFixed(3)}
            helper="Correlation only, not causation"
          />

          <MetricCard
            label="Correlation: Quantitative vs Total"
            value={analytics.correlations.quantitativeVsTotal.toFixed(3)}
            helper="Correlation only, not causation"
          />

          <MetricCard
            label="Correlation: Logical vs Total"
            value={analytics.correlations.logicalVsTotal.toFixed(3)}
            helper="Correlation only, not causation"
          />

        </section>

      </main>
    </>
  );
}