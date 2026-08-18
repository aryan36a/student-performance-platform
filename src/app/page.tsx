import Link from "next/link";

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

  const [overview, dashboard] = await Promise.all([
    getOverviewMetrics(importId),
    getDashboardAnalytics(importId),
  ]);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* Admin access */}
        <div className="flex justify-end">
          <Link
            href="/admin"
            className="
              inline-flex
              items-center
              rounded-lg
              border border-zinc-200
              bg-white
              px-3
              py-2
              text-sm
              font-medium
              text-zinc-700
              shadow-sm
              transition-colors
              hover:bg-zinc-50
              hover:text-zinc-950
              dark:border-zinc-700
              dark:bg-zinc-900
              dark:text-zinc-300
              dark:hover:bg-zinc-800
              dark:hover:text-white
            "
          >
            Admin Login
          </Link>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Students"
            value={`${overview.totalStudents}`}
          />

          <MetricCard
            label="Average Score"
            value={overview.averageScore.toFixed(2)}
          />

          <MetricCard
            label="Highest Score"
            value={overview.highestScore.toFixed(2)}
          />

          <MetricCard
            label="Lowest Score"
            value={overview.lowestScore.toFixed(2)}
          />

          <MetricCard
            label="Average Coding"
            value={overview.avgCoding.toFixed(2)}
          />

          <MetricCard
            label="Average Logical Reasoning"
            value={overview.avgLogicalReasoning.toFixed(2)}
          />

          <MetricCard
            label="Average Quantitative Aptitude"
            value={overview.avgQuantitativeAptitude.toFixed(2)}
          />
        </section>

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
          />
        )}
      </main>
    </>
  );
}