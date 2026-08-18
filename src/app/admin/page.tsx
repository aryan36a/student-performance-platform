import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { getImportHistory, getOverviewMetrics } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPanel } from "@/app/admin/admin-panel";
import { ImportHistory } from "@/components/admin/import-history";
import { signOutAdmin } from "@/app/admin/actions";

export default async function AdminPage() {
  await requireAdmin();

  const [overview, imports] = await Promise.all([getOverviewMetrics(), getImportHistory(20)]);
  const latest = imports[0];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Admin Panel</h1>
          <p className="text-sm text-zinc-500">Manage imports and refresh public analytics.</p>
        </div>
        <form action={signOutAdmin}>
          <Button variant="outline" type="submit">
            Sign out
          </Button>
        </form>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Dataset</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-700">{overview.totalStudents} students</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average Score</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-700">{overview.averageScore.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Last Imported File</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-700">{latest?.filename ?? "No imports yet"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Last Import Time</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-700">
            {latest ? format(new Date(latest.uploaded_at), "MMM dd, yyyy HH:mm") : "-"}
          </CardContent>
        </Card>
      </section>

      <AdminPanel />
      <ImportHistory rows={imports} />
    </main>
  );
}
