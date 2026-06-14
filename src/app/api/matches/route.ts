import { NextResponse } from "next/server";
import { getMatches } from "@/lib/data/world-cup";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const matches = await getMatches({
    team: params.get("team") ?? undefined,
    group: params.get("group") ?? undefined,
    stage: params.get("stage") ?? undefined,
    date: params.get("date") ?? undefined,
    status: params.get("status") ?? undefined
  });
  return NextResponse.json({ matches });
}
