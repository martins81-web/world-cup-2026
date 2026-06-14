import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasAdminAccess } from "@/lib/admin-request";
import { hashAdminPassword } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!hasAdminAccess(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  if (!hasAdminAccess(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { username?: string; password?: string; role?: "OWNER" | "ADMIN" | "VIEWER" };
  if (!body.username || !body.password) return NextResponse.json({ error: "Missing user data" }, { status: 400 });
  const user = await prisma.adminUser.create({
    data: { username: body.username, passwordHash: hashAdminPassword(body.password), role: body.role ?? "ADMIN" }
  });
  await prisma.auditEvent.create({ data: { action: "admin-user-created", entityType: "AdminUser", entityId: user.id } });
  return NextResponse.json({ user });
}
