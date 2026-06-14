import { NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/admin-request";
import { synchronizeAllProviders } from "@/lib/sync/synchronization-service";
import { prisma } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasAdminAccess(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.auditEvent.create({ data: { action: "sync-retry-requested", entityType: "SyncRun", entityId: id } });
  const results = await synchronizeAllProviders();
  return NextResponse.json({ results });
}
