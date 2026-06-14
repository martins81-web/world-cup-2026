import { NextResponse } from "next/server";
import { getStatistics } from "@/lib/data/world-cup";

export async function GET() {
  const statistics = await getStatistics();
  return NextResponse.json(statistics);
}
