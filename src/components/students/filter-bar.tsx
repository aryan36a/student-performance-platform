"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  LeaderboardSortKey,
  ScoreBand,
} from "@/types/student";

export type StudentFilterState = {
  query: string;
  branch: string;
  division: string;
  scoreBand: ScoreBand;
  sortKey: LeaderboardSortKey;
};

export function FilterBar({
  value,
  branches,
  divisions,
  onChange,
}: {
  value: StudentFilterState;
  branches: string[];
  divisions: string[];
  onChange: (next: StudentFilterState) => void;
}) {
  const branchOptions = useMemo(
    () => ["All", ...branches],
    [branches],
  );

  const divisionOptions = useMemo(
    () => ["All", ...divisions],
    [divisions],
  );

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="grid min-w-0 gap-3 md:grid-cols-5">

        {/* Search */}
        <div className="min-w-0 space-y-1.5">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Search
          </label>

          <Input
            placeholder="Search by student name"
            value={value.query}
            onChange={(event) =>
              onChange({
                ...value,
                query: event.target.value,
              })
            }
            className="h-10 w-full min-w-0"
          />
        </div>

        {/* Branch */}
        <div className="min-w-0 space-y-1.5">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Branch
          </label>

          <Select
            value={value.branch}
            onChange={(event) =>
              onChange({
                ...value,
                branch: event.target.value,
              })
            }
            className="h-10 w-full min-w-0"
          >
            {branchOptions.map((branch) => (
              <option
                key={branch}
                value={branch}
              >
                {branch === "All"
                  ? "All Branches"
                  : branch}
              </option>
            ))}
          </Select>
        </div>

        {/* Division */}
        <div className="min-w-0 space-y-1.5">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Division
          </label>

          <Select
            value={value.division}
            onChange={(event) =>
              onChange({
                ...value,
                division: event.target.value,
              })
            }
            className="h-10 w-full min-w-0"
          >
            {divisionOptions.map((division) => (
              <option
                key={division}
                value={division}
              >
                {division === "All"
                  ? "All Divisions"
                  : division}
              </option>
            ))}
          </Select>
        </div>

        {/* Score */}
        <div className="min-w-0 space-y-1.5">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Score
          </label>

          <Select
            value={value.scoreBand}
            onChange={(event) =>
              onChange({
                ...value,
                scoreBand:
                  event.target.value as ScoreBand,
              })
            }
            className="h-10 w-full min-w-0"
          >
            <option value="all">
              All Scores
            </option>

            <option value="90+">
              90%+
            </option>

            <option value="80-89">
              80–89%
            </option>

            <option value="70-79">
              70–79%
            </option>

            <option value="60-69">
              60–69%
            </option>

            <option value="below-60">
              Below 60%
            </option>
          </Select>
        </div>

        {/* Sort */}
        <div className="min-w-0 space-y-1.5">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Sort By
          </label>

          <Select
            value={value.sortKey}
            onChange={(event) =>
              onChange({
                ...value,
                sortKey:
                  event.target.value as LeaderboardSortKey,
              })
            }
            className="h-10 w-full min-w-0"
          >
            <option value="rank">
              Rank
            </option>

            <option value="name">
              Name
            </option>

            <option value="total">
              Total Score
            </option>

            <option value="coding">
              Coding
            </option>

            <option value="quantitative_aptitude">
              Quantitative Aptitude
            </option>

            <option value="logical_reasoning">
              Logical Reasoning
            </option>

            <option value="verbal_ability">
              Verbal Ability
            </option>

            <option value="computer_fundamentals">
              Computer Fundamentals
            </option>

            <option value="pseudocode_debugging">
              Pseudocode & Debugging
            </option>
          </Select>
        </div>

      </div>
    </div>
  );
}