import { NextResponse } from "next/server";
import { getThirdPlaceRanking } from "@/lib/data/world-cup";

export async function GET() {
  const { ranking } = await getThirdPlaceRanking();
  return NextResponse.json({ ranking });
}
