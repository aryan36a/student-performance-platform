import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { StudentProfile } from "@/components/students/student-profile";

import {
  getPublicStudentById,
  getPublicStudents,
  getStudentTestHistory,
} from "@/lib/data";

import { getRank } from "@/lib/ranking";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [
    student,
    allStudents,
    history,
  ] = await Promise.all([
    getPublicStudentById(id, "all"),
    getPublicStudents("all"),
    getStudentTestHistory(id),
  ]);

  if (!student) {
    notFound();
  }

  const sameBranch =
    allStudents.filter(
      (row) =>
        row.branch === student.branch,
    );

  const sameDivision =
    allStudents.filter(
      (row) =>
        row.branch === student.branch &&
        row.division ===
          student.division,
    );

  const branchRank = getRank(
    sameBranch,
    student.student_id,
  );

  const divisionRank = getRank(
    sameDivision,
    student.student_id,
  );

  return (
    <>
      <SiteHeader />

      <StudentProfile
        student={student}
        history={history}
        branchRank={branchRank}
        divisionRank={divisionRank}
      />
    </>
  );
}