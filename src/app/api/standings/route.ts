import { NextResponse } from "next/server";
import { getGroupsWithTables } from "@/lib/data/world-cup";

export async function GET() {
  const { tables } = await getGroupsWithTables();
  return NextResponse.json({ standings: tables });
}
