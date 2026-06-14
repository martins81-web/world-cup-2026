import { NextResponse } from "next/server";
import { getPlayerById } from "@/lib/data/world-cup";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { player } = await getPlayerById(id);
  if (!player) return NextResponse.json({ error: "Not available" }, { status: 404 });
  return NextResponse.json({ player });
}
