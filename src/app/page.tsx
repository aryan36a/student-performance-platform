import { SiteHeader } from "@/components/layout/site-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ScoreCharts } from "@/components/dashboard/score-charts";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getDashboardAnalytics,
  getOverviewMetrics,
} from "@/lib/data";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    test?: string;
  }>;
}) {
  const params = await searchParams;
  const importId = params.test;

  /*
   * All Time means there is no specific test selected.
   */
  const isAllTime =
    !importId || importId === "all";

  const [overview, dashboard] = await Promise.all([
    getOverviewMetrics(importId),
    getDashboardAnalytics(importId),
  ]);

  /*
   * Convert a score into a percentage.
   *
   * Overall score:
   * 70 marks maximum.
   *
   * Individual subjects:
   * handled separately inside ScoreCharts.
   */
  const toPercentage = (
    value: number,
    max: number,
  ) => {
    if (max <= 0) return 0;

    return (value / max) * 100;
  };

  const averageScore = isAllTime
    ? toPercentage(overview.averageScore, 70)
    : overview.averageScore;

  const highestScore = isAllTime
    ? toPercentage(overview.highestScore, 70)
    : overview.highestScore;

  const lowestScore = isAllTime
    ? toPercentage(overview.lowestScore, 70)
    : overview.lowestScore;

  const avgCoding = isAllTime
    ? toPercentage(overview.avgCoding, 20)
    : overview.avgCoding;

  const avgLogicalReasoning = isAllTime
    ? toPercentage(
        overview.avgLogicalReasoning,
        10,
      )
    : overview.avgLogicalReasoning;

  const avgQuantitativeAptitude = isAllTime
    ? toPercentage(
        overview.avgQuantitativeAptitude,
        10,
      )
    : overview.avgQuantitativeAptitude;

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* =====================================================
            OVERVIEW METRICS
            ===================================================== */}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <MetricCard
            label="Total Students"
            value={`${overview.totalStudents}`}
          />

          <MetricCard
            label="Average Score"
            value={
              isAllTime
                ? `${averageScore.toFixed(2)}%`
                : averageScore.toFixed(2)
            }
          />

          <MetricCard
            label="Highest Score"
            value={
              isAllTime
                ? `${highestScore.toFixed(2)}%`
                : highestScore.toFixed(2)
            }
          />

          <MetricCard
            label="Lowest Score"
            value={
              isAllTime
                ? `${lowestScore.toFixed(2)}%`
                : lowestScore.toFixed(2)
            }
          />

          <MetricCard
            label="Average Coding"
            value={
              isAllTime
                ? `${avgCoding.toFixed(2)}%`
                : avgCoding.toFixed(2)
            }
          />

          <MetricCard
            label="Average Logical Reasoning"
            value={
              isAllTime
                ? `${avgLogicalReasoning.toFixed(2)}%`
                : avgLogicalReasoning.toFixed(2)
            }
          />

          <MetricCard
            label="Average Quantitative Aptitude"
            value={
              isAllTime
                ? `${avgQuantitativeAptitude.toFixed(2)}%`
                : avgQuantitativeAptitude.toFixed(2)
            }
          />

        </section>

        {/* =====================================================
            CHARTS
            ===================================================== */}

        {dashboard.students.length === 0 ? (
          <EmptyState
            title="No dataset imported yet"
            description="Upload an Excel file from the admin panel to begin."
          />
        ) : (
          <ScoreCharts
            histogram={dashboard.histogram}
            subjects={dashboard.subjectAverages}
            branch={dashboard.branchAverages}
            division={dashboard.divisionAverages}
            isAllTime={isAllTime}
          />
        )}

      </main>
    </>
  );
}