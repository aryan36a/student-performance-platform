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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
}: {
  title: string;
  data: Item[];
  xKey: string;
  yKey: string;
  maxValue?: number;
}) {
  /*
   * Give each row enough vertical space so that long labels
   * don't overlap each other.
   */
  const chartHeight = Math.max(280, data.length * 52 + 60);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
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
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e4e4e7"
                horizontal={false}
              />

              {/* Numeric axis */}
              <XAxis
                type="number"
                domain={
                  maxValue !== undefined
                    ? [0, maxValue]
                    : [0, "dataMax"]
                }
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

              {/* Category axis */}
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

              <Tooltip
                contentStyle={{
                  borderRadius: 6,
                  border: "1px solid #e4e4e7",
                  boxShadow: "none",
                  fontSize: "12px",
                }}
              />

              <Bar
                dataKey={yKey}
                radius={[0, 4, 4, 0]}
                barSize={26}
              >
                {data.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={palette[idx % palette.length]}
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
}: {
  histogram: { range: string; count: number }[];
  subjects: { subject: string; average: number }[];
  branch: { label: string; average: number }[];
  division: { label: string; average: number }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Score Distribution */}
      <ChartCard
        title="Score Distribution"
        data={histogram}
        xKey="range"
        yKey="count"
      />

      {/* Subject Performance */}
      <ChartCard
        title="Subject Performance"
        data={subjects}
        xKey="subject"
        yKey="average"
        maxValue={20}
      />

      {/* Branch Performance */}
      <ChartCard
        title="Branch Performance"
        data={branch}
        xKey="label"
        yKey="average"
        maxValue={70}
      />

      {/* Division Performance */}
      <ChartCard
        title="Division Performance"
        data={division}
        xKey="label"
        yKey="average"
        maxValue={70}
      />
    </div>
  );
}