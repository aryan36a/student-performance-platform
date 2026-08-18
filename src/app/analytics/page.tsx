import { SiteHeader } from "@/components/layout/site-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SubjectBreakdown } from "@/components/dashboard/subject-breakdown";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  const analytics = await getDetailedAnalytics(
    params.test,
  );

  const isAllTime =
    !params.test ||
    params.test === "all";

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6 sm:px-6 lg:px-8">

        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Analytics
        </h1>

        {/* Overall Statistics */}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

          <MetricCard
            label="Average Score"
            value={`${analytics.overall.average.toFixed(2)}${isAllTime ? "%" : ""}`}
          />

          <MetricCard
            label="Median Score"
            value={`${analytics.overall.median.toFixed(2)}${isAllTime ? "%" : ""}`}
          />

          <MetricCard
            label="Highest Score"
            value={`${analytics.overall.highest.toFixed(2)}${isAllTime ? "%" : ""}`}
          />

          <MetricCard
            label="Lowest Score"
            value={`${analytics.overall.lowest.toFixed(2)}${isAllTime ? "%" : ""}`}
          />

          <MetricCard
            label="Std Deviation"
            value={`${analytics.overall.standardDeviation.toFixed(2)}${isAllTime ? "%" : ""}`}
          />

        </section>

        {/* Subject Analysis */}

        <SubjectBreakdown
  rows={analytics.subjects}
  isAllTime={isAllTime}
/>

        {/* Branch + Division */}

        <section className="grid gap-4 lg:grid-cols-2">

          <Card>
            <CardHeader>
              <CardTitle>
                Branch Analysis
              </CardTitle>
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
                  {analytics.branchStats.map(
                    (row) => (
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
                          {row.average.toFixed(2)}
                          {isAllTime ? "%" : ""}
                        </td>

                        <td className="py-2 text-right">
                          {row.highest.toFixed(2)}
                          {isAllTime ? "%" : ""}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>

              </table>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Division Analysis
              </CardTitle>
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
                  {analytics.divisionStats.map(
                    (row) => (
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
                          {row.average.toFixed(2)}
                          {isAllTime ? "%" : ""}
                        </td>

                        <td className="py-2 text-right">
                          {row.highest.toFixed(2)}
                          {isAllTime ? "%" : ""}
                        </td>
                      </tr>
                    ),
                  )}
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