import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Math.min(100, Number(url.searchParams.get("pageSize") ?? "20"));

  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;

  const supabase = await createServerSupabaseClient();
  const { data, error, count } = await supabase
    .from("student_public_scores")
    .select("*", { count: "exact" })
    .order("total", { ascending: false })
    .order("name", { ascending: true })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: "Unable to fetch students" }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
  });
}
