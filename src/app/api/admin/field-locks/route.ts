import { NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/admin-request";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  if (!hasAdminAccess(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { entityType?: string; entityId?: string; field?: string; reason?: string };
  if (!body.entityType || !body.entityId || !body.field) return NextResponse.json({ error: "Missing lock data" }, { status: 400 });
  const lock = await prisma.manualFieldLock.upsert({
    where: { entityType_entityId_field: { entityType: body.entityType, entityId: body.entityId, field: body.field } },
    update: { reason: body.reason },
    create: { entityType: body.entityType, entityId: body.entityId, field: body.field, reason: body.reason }
  });
  await prisma.auditEvent.create({ data: { action: "field-locked", entityType: body.entityType, entityId: body.entityId, metadata: { field: body.field, reason: body.reason } } });
  return NextResponse.json({ lock });
}
