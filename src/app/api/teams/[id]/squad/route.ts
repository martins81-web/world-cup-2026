import { NextResponse } from "next/server";
import { getTeamSquad } from "@/lib/data/world-cup";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { team, squad } = await getTeamSquad(id);
  if (!team) return NextResponse.json({ error: "Not available" }, { status: 404 });
  return NextResponse.json({ team, squad });
}
