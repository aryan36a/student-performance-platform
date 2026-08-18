"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { LeaderboardSortKey, ScoreBand } from "@/types/student";

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
  const branchOptions = useMemo(() => ["All", ...branches], [branches]);
  const divisionOptions = useMemo(() => ["All", ...divisions], [divisions]);

  return (
    <div className="grid gap-2 rounded-md border border-zinc-200 bg-white p-3 md:grid-cols-5">
      <Input
        placeholder="Search by student name"
        value={value.query}
        onChange={(event) => onChange({ ...value, query: event.target.value })}
      />
      <Select
        value={value.branch}
        onChange={(event) => onChange({ ...value, branch: event.target.value })}
      >
        {branchOptions.map((branch) => (
          <option key={branch} value={branch}>
            {branch}
          </option>
        ))}
      </Select>
      <Select
        value={value.division}
        onChange={(event) => onChange({ ...value, division: event.target.value })}
      >
        {divisionOptions.map((division) => (
          <option key={division} value={division}>
            {division}
          </option>
        ))}
      </Select>
      <Select
        value={value.scoreBand}
        onChange={(event) => onChange({ ...value, scoreBand: event.target.value as ScoreBand })}
      >
        <option value="all">All Scores</option>
        <option value="90+">90%+</option>
        <option value="80-89">80-89%</option>
        <option value="70-79">70-79%</option>
        <option value="60-69">60-69%</option>
        <option value="below-60">Below 60%</option>
      </Select>
      <Select
        value={value.sortKey}
        onChange={(event) => onChange({ ...value, sortKey: event.target.value as LeaderboardSortKey })}
      >
        <option value="rank">Sort: Rank</option>
        <option value="name">Sort: Name</option>
        <option value="total">Sort: Total</option>
        <option value="coding">Sort: Coding</option>
        <option value="quantitative_aptitude">Sort: Quantitative Aptitude</option>
        <option value="logical_reasoning">Sort: Logical Reasoning</option>
        <option value="verbal_ability">Sort: Verbal Ability</option>
        <option value="computer_fundamentals">Sort: Computer Fundamentals</option>
        <option value="pseudocode_debugging">Sort: Pseudocode & Debugging</option>
      </Select>
    </div>
  );
}
