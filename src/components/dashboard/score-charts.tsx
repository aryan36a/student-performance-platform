"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const palette = [
  "#111827",
  "#374151",
  "#4b5563",
  "#6b7280",
  "#9ca3af",
  "#d1d5db",
];

type Item = Record<string, string | number>;

function ChartCard({
  title,
  data,
  xKey,
  yKey,
  maxValue,
  isPercentage = false,
}: {
  title: string;
  data: Item[];
  xKey: string;
  yKey: string;
  maxValue?: number;
  isPercentage?: boolean;
}) {
  /*
   * Give each row enough vertical space so that
   * long labels don't overlap.
   */
  const chartHeight = Math.max(
    280,
    data.length * 52 + 60,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 8,
                right: 24,
                bottom: 8,
                left: 8,
              }}
            >
              {/* =================================================
                  GRID
                  ================================================= */}

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e4e4e7"
                horizontal={false}
              />

              {/* =================================================
                  NUMERIC AXIS
                  ================================================= */}

              <XAxis
                type="number"
                domain={
                  maxValue !== undefined
                    ? [0, maxValue]
                    : [0, "dataMax"]
                }
                tickFormatter={(value) => {
                  const numericValue =
                    Number(value);

                  return isPercentage
                    ? `${numericValue.toFixed(0)}%`
                    : numericValue.toFixed(0);
                }}
                tick={{
                  fill: "#52525b",
                  fontSize: 12,
                }}
                axisLine={{
                  stroke: "#a1a1aa",
                }}
                tickLine={{
                  stroke: "#a1a1aa",
                }}
              />

              {/* =================================================
                  CATEGORY AXIS
                  ================================================= */}

              <YAxis
                type="category"
                dataKey={xKey}
                width={220}
                interval={0}
                tick={{
                  fill: "#52525b",
                  fontSize: 12,
                }}
                axisLine={{
                  stroke: "#a1a1aa",
                }}
                tickLine={false}
              />

              {/* =================================================
                  TOOLTIP
                  ================================================= */}

              <Tooltip
                formatter={(value) => {
                  const numericValue =
                    Number(value);

                  if (Number.isNaN(numericValue)) {
                    return value;
                  }

                  return isPercentage
                    ? `${numericValue.toFixed(2)}%`
                    : numericValue.toFixed(2);
                }}
                contentStyle={{
                  borderRadius: 6,
                  border: "1px solid #e4e4e7",
                  boxShadow: "none",
                  fontSize: "12px",
                }}
              />

              {/* =================================================
                  BARS
                  ================================================= */}

              <Bar
                dataKey={yKey}
                radius={[0, 4, 4, 0]}
                barSize={26}
              >
                {data.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={
                      palette[
                        idx % palette.length
                      ]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScoreCharts({
  histogram,
  subjects,
  branch,
  division,
  isAllTime,
}: {
  histogram: {
    range: string;
    count: number;
  }[];

  subjects: {
    subject: string;
    average: number;
  }[];

  branch: {
    label: string;
    average: number;
  }[];

  division: {
    label: string;
    average: number;
  }[];

  isAllTime: boolean;
}) {
  /*
   * IMPORTANT:
   *
   * The data returned for All Time is already normalized
   * to percentages.
   *
   * Therefore:
   *
   *     64.45 means 64.45%
   *
   * NOT:
   *
   *     64.45 / 10 * 100
   *
   * We only change the display/axis here.
   */

  const subjectData = subjects;
  const branchData = branch;
  const divisionData = division;

  return (
    <div className="grid gap-4 lg:grid-cols-2">

      {/* =====================================================
          SCORE DISTRIBUTION
          ===================================================== */}

      <ChartCard
        title="Score Distribution"
        data={histogram}
        xKey="range"
        yKey="count"
      />

      {/* =====================================================
          SUBJECT PERFORMANCE
          ===================================================== */}

      <ChartCard
        title="Subject Performance"
        data={subjectData}
        xKey="subject"
        yKey="average"
        maxValue={
          isAllTime
            ? 100
            : 20
        }
        isPercentage={isAllTime}
      />

      {/* =====================================================
          BRANCH PERFORMANCE
          ===================================================== */}

      <ChartCard
        title="Branch Performance"
        data={branchData}
        xKey="label"
        yKey="average"
        maxValue={
          isAllTime
            ? 100
            : 70
        }
        isPercentage={isAllTime}
      />

      {/* =====================================================
          DIVISION PERFORMANCE
          ===================================================== */}

      <ChartCard
        title="Division Performance"
        data={divisionData}
        xKey="label"
        yKey="average"
        maxValue={
          isAllTime
            ? 100
            : 70
        }
        isPercentage={isAllTime}
      />

    </div>
  );
}