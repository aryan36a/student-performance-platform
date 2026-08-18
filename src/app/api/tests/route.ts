import { NextResponse } from "next/server";
import { getAvailableTests } from "@/lib/data";

export async function GET() {
  const tests = await getAvailableTests();

  return NextResponse.json(tests);
}