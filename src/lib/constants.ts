import type { SubjectKey } from "@/types/student";

export const SUBJECT_LABELS: Record<SubjectKey, string> = {
  computer_fundamentals: "Computer Fundamentals",
  quantitative_aptitude: "Quantitative Aptitude",
  logical_reasoning: "Logical Reasoning",
  verbal_ability: "Verbal Ability",
  pseudocode_debugging: "Pseudocode & Debugging",
  coding: "Coding",
};

export const REQUIRED_HEADERS = [
  "Name",
  "Branch",
  "Division",
  "University PRN",
  "Computer Fundamentals",
  "Quantitative Aptitude",
  "Logical Reasoning",
  "Verbal Ability",
  "Pseudocode & Debugging",
  "Coding",
  "Total",
];

export const OPTIONAL_HEADERS = ["Sr. No.", "Mobile", "Email"];

export const SUBJECT_MAX_SCORES: Record<SubjectKey, number> = {
  computer_fundamentals: 10,
  quantitative_aptitude: 10,
  logical_reasoning: 10,
  verbal_ability: 10,
  pseudocode_debugging: 10,
  coding: 20,
};

export const TOTAL_MAX_SCORE = 70;
export const MAX_UPLOAD_SIZE_BYTES = 6 * 1024 * 1024;