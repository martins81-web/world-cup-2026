import { NextResponse } from "next/server";
import { getBracket } from "@/lib/data/world-cup";

export async function GET() {
  const bracket = await getBracket();
  return NextResponse.json({ rounds: bracket.rounds, matches: bracket.matches });
}
