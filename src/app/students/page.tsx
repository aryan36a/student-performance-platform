import { SiteHeader } from "@/components/layout/site-header";
import { StudentDirectoryTable } from "@/components/students/directory-table";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublicStudents } from "@/lib/data";

export const revalidate = 60;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    test?: string;
  }>;
}) {
  const params = await searchParams;

  const students = await getPublicStudents(
    params.test,
  );

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Student Directory
        </h1>

        {students.length === 0 ? (
          <EmptyState
            title="No students found"
            description="Upload an Excel file from the admin panel to populate student data."
          />
        ) : (
          <StudentDirectoryTable students={students} />
        )}
      </main>
    </>
  );
}