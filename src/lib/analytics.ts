import type {
  StudentPublicScore,
  SubjectKey,
} from "@/types/student";

import {
  SUBJECT_LABELS,
} from "@/lib/constants";

export function average(values: number[]) {
  if (values.length === 0) return 0;

  return (
    values.reduce(
      (sum, value) => sum + value,
      0,
    ) / values.length
  );
}

export function median(values: number[]) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort(
    (a, b) => a - b,
  );

  const middle = Math.floor(
    sorted.length / 2,
  );

  if (sorted.length % 2 === 0) {
    return (
      sorted[middle - 1] +
      sorted[middle]
    ) / 2;
  }

  return sorted[middle];
}

export function standardDeviation(
  values: number[],
) {
  if (values.length === 0) return 0;

  const mean = average(values);

  const variance = average(
    values.map(
      (value) =>
        (value - mean) ** 2,
    ),
  );

  return Math.sqrt(variance);
}


/*
 * Subject averages
 *
 * For All Time:
 *   values are already percentages.
 *
 * For an individual test:
 *   values are raw marks.
 *
 * The caller is responsible for deciding
 * how the values should be displayed.
 */
export function subjectAverages(
  rows: StudentPublicScore[],
) {
  const subjectKeys =
    Object.keys(
      SUBJECT_LABELS,
    ) as SubjectKey[];

  return subjectKeys.map(
    (key) => ({
      subject:
        SUBJECT_LABELS[key],

      key,

      average: average(
        rows.map(
          (row) =>
            Number(row[key]),
        ),
      ),
    }),
  );
}


/*
 * Group students by branch/division.
 *
 * `total` is intentionally used directly.
 *
 * All Time:
 *   total = percentage
 *
 * Individual test:
 *   total = raw marks
 */
export function groupedBy<
  T extends "branch" | "division",
>(
  rows: StudentPublicScore[],
  key: T,
) {
  const groups =
    new Map<
      string,
      StudentPublicScore[]
    >();

  rows.forEach((row) => {
    const groupKey =
      row[key];

    const current =
      groups.get(groupKey) ?? [];

    current.push(row);

    groups.set(
      groupKey,
      current,
    );
  });

  return Array.from(
    groups.entries(),
  ).map(
    ([label, items]) => ({
      label,

      count: items.length,

      average: average(
        items.map(
          (item) =>
            Number(item.total),
        ),
      ),

      highest: Math.max(
        ...items.map(
          (item) =>
            Number(item.total),
        ),
      ),

      lowest: Math.min(
        ...items.map(
          (item) =>
            Number(item.total),
        ),
      ),
    }),
  );
}


/*
 * Group by branch + division.
 */
export function groupedByDivision(
  rows: StudentPublicScore[],
) {
  const groups =
    new Map<
      string,
      StudentPublicScore[]
    >();

  rows.forEach((row) => {
    const key =
      `${row.branch}|||${row.division}`;

    const current =
      groups.get(key) ?? [];

    current.push(row);

    groups.set(
      key,
      current,
    );
  });

  return Array.from(
    groups.entries(),
  )
    .map(
      ([key, items]) => {
        const [
          branch,
          division,
        ] = key.split("|||");

        return {
          label:
            `${branch} — ${division}`,

          division,

          branch,

          count:
            items.length,

          average:
            average(
              items.map(
                (item) =>
                  Number(
                    item.total,
                  ),
              ),
            ),

          highest:
            Math.max(
              ...items.map(
                (item) =>
                  Number(
                    item.total,
                  ),
              ),
            ),

          lowest:
            Math.min(
              ...items.map(
                (item) =>
                  Number(
                    item.total,
                  ),
              ),
            ),
        };
      },
    )
    .sort(
      (a, b) =>
        a.branch.localeCompare(
          b.branch,
        ) ||
        a.division.localeCompare(
          b.division,
        ),
    );
}


/*
 * Group by branch + division.
 */
export function groupedByBranchAndDivision(
  rows: StudentPublicScore[],
) {
  const groups =
    new Map<
      string,
      StudentPublicScore[]
    >();

  rows.forEach((row) => {
    const groupKey =
      `${row.branch} — ${row.division}`;

    const current =
      groups.get(groupKey) ?? [];

    current.push(row);

    groups.set(
      groupKey,
      current,
    );
  });

  return Array.from(
    groups.entries(),
  )
    .map(
      ([label, items]) => ({
        label,

        count:
          items.length,

        average:
          average(
            items.map(
              (item) =>
                Number(
                  item.total,
                ),
            ),
          ),

        highest:
          Math.max(
            ...items.map(
              (item) =>
                Number(
                  item.total,
                ),
            ),
          ),

        lowest:
          Math.min(
            ...items.map(
              (item) =>
                Number(
                  item.total,
                ),
            ),
          ),
      }),
    )
    .sort(
      (a, b) =>
        a.label.localeCompare(
          b.label,
        ),
    );
}


/*
 * Score histogram
 *
 * IMPORTANT:
 *
 * getPublicStudents("all") converts
 * All Time totals into percentages.
 *
 * Therefore we MUST NOT divide by
 * TOTAL_MAX_SCORE here.
 *
 * Individual tests are not supposed
 * to use this percentage histogram
 * until their UI explicitly requests
 * a percentage representation.
 */
export function scoreHistogram(
  rows: StudentPublicScore[],
) {
  const bins = [
    {
      range: "0-19%",
      min: 0,
      max: 20,
    },
    {
      range: "20-39%",
      min: 20,
      max: 40,
    },
    {
      range: "40-59%",
      min: 40,
      max: 60,
    },
    {
      range: "60-69%",
      min: 60,
      max: 70,
    },
    {
      range: "70-79%",
      min: 70,
      max: 80,
    },
    {
      range: "80-89%",
      min: 80,
      max: 90,
    },
    {
      range: "90-100%",
      min: 90,
      max: 101,
    },
  ];

  return bins.map(
    (bin) => ({
      range: bin.range,

      count: rows.filter(
        (row) => {
          const score =
            Number(row.total);

          return (
            score >= bin.min &&
            score < bin.max
          );
        },
      ).length,
    }),
  );
}


/*
 * Pearson correlation.
 */
export function pearsonCorrelation(
  x: number[],
  y: number[],
) {
  if (
    x.length !== y.length ||
    x.length === 0
  ) {
    return 0;
  }

  const xMean =
    average(x);

  const yMean =
    average(y);

  let numerator = 0;
  let xVariance = 0;
  let yVariance = 0;

  for (
    let i = 0;
    i < x.length;
    i += 1
  ) {
    const xDiff =
      x[i] - xMean;

    const yDiff =
      y[i] - yMean;

    numerator +=
      xDiff * yDiff;

    xVariance +=
      xDiff * xDiff;

    yVariance +=
      yDiff * yDiff;
  }

  const denominator =
    Math.sqrt(
      xVariance *
        yVariance,
    );

  if (
    denominator === 0
  ) {
    return 0;
  }

  return (
    numerator /
    denominator
  );
}