import { NextResponse } from "next/server";
import { getTeams } from "@/lib/data/world-cup";

export async function GET() {
  const { teams } = await getTeams();
  return NextResponse.json({ teams });
}
