import { NextResponse } from "next/server";
import { getMatchById } from "@/lib/data/world-cup";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) return NextResponse.json({ error: "Not available" }, { status: 404 });
  return NextResponse.json({ match });
}
