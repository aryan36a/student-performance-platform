"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
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

import { SUBJECT_LABELS } from "@/lib/constants";
import type { SubjectKey } from "@/types/student";

import type { StudentTestResult } from "@/lib/data";

type StudentData = {
  student_id: string;
  name: string;
  branch: string;
  division: string;
  rank: number;
  total: number;
  computer_fundamentals: number;
  quantitative_aptitude: number;
  logical_reasoning: number;
  verbal_ability: number;
  pseudocode_debugging: number;
  coding: number;
};

type Props = {
  student: StudentData;
  history: StudentTestResult[];
  branchRank: number;
  divisionRank: number;
};

const SUBJECT_KEYS = Object.keys(SUBJECT_LABELS) as SubjectKey[];

function percentage(obtained: number, maximum: number) {
  if (maximum <= 0) return 0;
  return (obtained / maximum) * 100;
}

export function StudentProfile({
  student,
  history,
  branchRank,
  divisionRank,
}: Props) {
  const [selectedTest, setSelectedTest] = useState<string>("all");

  /*
   * ------------------------------------------------------------
   * ALL-TIME DATA
   * ------------------------------------------------------------
   */

  const allTime = useMemo(() => {
    if (history.length === 0) {
      return {
        total: 0,
        maxTotal: 0,
        percentage: 0,
        subjects: {} as Record<
          string,
          {
            obtained: number;
            max: number;
          }
        >,
      };
    }

    const subjects = {} as Record<
      string,
      {
        obtained: number;
        max: number;
      }
    >;

    for (const key of SUBJECT_KEYS) {
      subjects[key] = {
        obtained: history.reduce(
          (sum, test) => sum + Number(test[key]),
          0,
        ),

        max: history.reduce(
          (sum, test) => sum + Number(test.maxScores[key]),
          0,
        ),
      };
    }

    const total = history.reduce(
      (sum, test) => sum + Number(test.total),
      0,
    );

    const maxTotal = history.reduce(
      (sum, test) => sum + Number(test.maxTotal),
      0,
    );

    return {
      total,
      maxTotal,
      percentage: percentage(total, maxTotal),
      subjects,
    };
  }, [history]);

  /*
   * ------------------------------------------------------------
   * SELECTED TEST
   * ------------------------------------------------------------
   */

  const currentTest =
    selectedTest === "all"
      ? null
      : history.find(
          (test) => test.importId === selectedTest,
        ) ?? null;

  const isAllTime = selectedTest === "all";

  /*
   * ------------------------------------------------------------
   * SUBJECT DATA
   * ------------------------------------------------------------
   */

  const subjects = useMemo(() => {
    if (currentTest) {
      return SUBJECT_KEYS.map((key) => ({
        key,
        label: SUBJECT_LABELS[key],
        obtained: Number(currentTest[key]),
        max: Number(currentTest.maxScores[key]),
      }));
    }

    return SUBJECT_KEYS.map((key) => ({
      key,
      label: SUBJECT_LABELS[key],
      obtained:
        allTime.subjects[key]?.obtained ?? 0,
      max:
        allTime.subjects[key]?.max ?? 0,
    }));
  }, [currentTest, allTime]);

  /*
   * ------------------------------------------------------------
   * DISPLAYED TOTAL
   * ------------------------------------------------------------
   */

  const displayedTotal =
    currentTest?.total ?? allTime.total;

  const displayedMaxTotal =
    currentTest?.maxTotal ?? allTime.maxTotal;

  const displayedPercentage =
    currentTest?.percentage ?? allTime.percentage;

  /*
   * ------------------------------------------------------------
   * BEST SUBJECT
   * ------------------------------------------------------------
   */

  const bestSubject = useMemo(() => {
    if (subjects.length === 0) {
      return null;
    }

    return subjects.reduce(
      (best, subject) => {
        const subjectPercentage = percentage(
          subject.obtained,
          subject.max,
        );

        if (!best) {
          return {
            ...subject,
            percentage: subjectPercentage,
          };
        }

        return subjectPercentage > best.percentage
          ? {
              ...subject,
              percentage: subjectPercentage,
            }
          : best;
      },
      null as
        | (typeof subjects[number] & {
            percentage: number;
          })
        | null,
    );
  }, [subjects]);

  /*
   * ------------------------------------------------------------
   * IMPROVEMENT GRAPH
   * ------------------------------------------------------------
   */

  const chartData = useMemo(
    () =>
      history.map((test, index) => ({
        name:
          test.testName ||
          `Test ${index + 1}`,

        percentage: Number(
          test.percentage.toFixed(2),
        ),
      })),
    [history],
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 py-6 sm:px-6 lg:px-8">

      {/* ======================================================
          STUDENT HEADER + TEST SELECTOR
          ====================================================== */}

      <Card className="overflow-hidden">
        <CardContent className="p-0">

          <div className="flex flex-col gap-4 border-b border-zinc-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
                {student.name}
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                {student.branch}
                <span className="mx-1.5">•</span>
                Division {student.division}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-500">
                Test
              </span>

              <select
                id="student-test"
                value={selectedTest}
                onChange={(event) =>
                  setSelectedTest(event.target.value)
                }
                className="min-w-[170px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100"
              >
                <option value="all">
                  All Time
                </option>

                {history.map((test) => (
                  <option
                    key={test.importId}
                    value={test.importId}
                  >
                    {test.testName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ==================================================
              MAIN SCORE
              ================================================== */}

          <div className="px-6 py-6">

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">

              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Overall Performance
                </p>

                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-4xl font-bold tracking-tight text-zinc-950">
                    {displayedPercentage.toFixed(2)}%
                  </span>

                  <span className="text-sm text-zinc-500">
                    {displayedTotal.toFixed(2)} /{" "}
                    {displayedMaxTotal.toFixed(2)}
                  </span>
                </div>

                <p className="mt-1 text-xs text-zinc-400">
                  {isAllTime
                    ? "Combined performance across all tests"
                    : currentTest?.testName}
                </p>
              </div>

              {/* RANKS */}

              <div className="grid grid-cols-3 gap-3">

                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-xs text-zinc-500">
                    Overall Rank
                  </p>

                  <p className="mt-1 text-xl font-semibold text-zinc-950">
                    #{student.rank}
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-xs text-zinc-500">
                    Branch Rank
                  </p>

                  <p className="mt-1 text-xl font-semibold text-zinc-950">
                    #{branchRank}
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-xs text-zinc-500">
                    Division Rank
                  </p>

                  <p className="mt-1 text-xl font-semibold text-zinc-950">
                    #{divisionRank}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================
          BEST SUBJECT + SUBJECT PERFORMANCE
          ====================================================== */}

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">

        {/* BEST SUBJECT */}

        {bestSubject && (
          <Card>
            <CardHeader>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Strongest Area
              </p>

              <CardTitle className="text-lg">
                Best Subject
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-lg font-semibold text-zinc-950">
                {bestSubject.label}
              </p>

              <div className="mt-4">
                <p className="text-3xl font-bold text-zinc-950">
                  {bestSubject.percentage.toFixed(2)}%
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  {bestSubject.obtained.toFixed(2)} /{" "}
                  {bestSubject.max.toFixed(2)}
                </p>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-zinc-900"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        bestSubject.percentage,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* SUBJECT PERFORMANCE */}

        <Card>
          <CardHeader>
            <CardTitle>
              Subject Performance
            </CardTitle>

            <p className="text-sm text-zinc-500">
              {isAllTime
                ? "Combined percentage across all tests"
                : "Performance in the selected test"}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">

            {subjects.map((subject) => {
              const subjectPercentage =
                percentage(
                  subject.obtained,
                  subject.max,
                );

              const clamped = Math.max(
                0,
                Math.min(
                  100,
                  subjectPercentage,
                ),
              );

              return (
                <div key={subject.key}>

                  <div className="mb-1.5 flex items-center justify-between gap-4">

                    <span className="text-sm font-medium text-zinc-700">
                      {subject.label}
                    </span>

                    <div className="text-right">
                      <span className="text-sm font-semibold text-zinc-950">
                        {subjectPercentage.toFixed(2)}%
                      </span>

                      <span className="ml-2 text-xs text-zinc-400">
                        {subject.obtained.toFixed(2)} /{" "}
                        {subject.max.toFixed(2)}
                      </span>
                    </div>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-zinc-900 transition-all duration-300"
                      style={{
                        width: `${clamped}%`,
                      }}
                    />
                  </div>

                </div>
              );
            })}

          </CardContent>
        </Card>
      </div>

      {/* ======================================================
          PERFORMANCE TREND
          ====================================================== */}

      {history.length > 0 && (
        <Card>

          <CardHeader>
            <CardTitle>
              Performance Trend
            </CardTitle>

            <p className="text-sm text-zinc-500">
              Percentage score across tests
            </p>
          </CardHeader>

          <CardContent>

            <div className="h-80 w-full">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e4e4e7"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 12,
                    }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tick={{
                      fontSize: 12,
                    }}
                    tickFormatter={(value) =>
                      `${value}%`
                    }
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    formatter={(value) =>
                      `${Number(value).toFixed(2)}%`
                    }

                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e4e4e7",
                      boxShadow:
                        "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#18181b"
                    strokeWidth={2.5}
                    dot={{
                      r: 4,
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />

                </LineChart>
              </ResponsiveContainer>

            </div>

          </CardContent>
        </Card>
      )}

    </main>
  );
}