import { NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/admin-request";
import { getReconciliationReport } from "@/lib/reconciliation";

export async function GET(request: Request) {
  if (!hasAdminAccess(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getReconciliationReport());
}
