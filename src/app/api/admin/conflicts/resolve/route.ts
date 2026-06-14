import { NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/admin-request";
import { mergeDuplicate, resolveConflict, resolveMappingIssue } from "@/lib/conflict-resolution";

export async function POST(request: Request) {
  if (!hasAdminAccess(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (body.kind === "mapping") await resolveMappingIssue(body);
  else if (body.kind === "conflict") await resolveConflict(body);
  else if (body.kind === "merge") await mergeDuplicate(body);
  else return NextResponse.json({ error: "Unknown resolution kind" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
