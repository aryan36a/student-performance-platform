import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { data: adminCheck } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminCheck) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 },
    );
  }

  let body: {
    importId?: string;
    deleteAll?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (body.deleteAll === true) {
    const { error } = await supabase.rpc(
      "delete_all_student_imports",
    );

    if (error) {
      console.error("[delete imports] RPC error:", error);

      return NextResponse.json(
        {
          error: "Failed to delete all imports.",
          details: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      deletedAll: true,
    });
  }

  if (!body.importId) {
    return NextResponse.json(
      { error: "importId is required" },
      { status: 400 },
    );
  }

  const { error } = await supabase.rpc(
    "delete_student_import",
    {
      p_import_id: body.importId,
    },
  );

  if (error) {
    console.error("[delete import] RPC error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete import.",
        details: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    deletedImportId: body.importId,
  });
}