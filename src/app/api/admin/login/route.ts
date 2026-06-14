import { NextResponse } from "next/server";
import { adminCookieName, createAdminSession, verifyAdminPassword } from "@/lib/admin-auth";
import { checkPersistentRateLimit } from "@/lib/admin-rate-limit";
import { env } from "@/lib/env";
import { logApp } from "@/lib/logger";
import { getRequestIdentifier } from "@/lib/admin-request";

export async function POST(request: Request) {
  const identifier = getRequestIdentifier(request);
  const limit = await checkPersistentRateLimit({ identifier, action: "admin-login", maxRequests: 5, windowMs: 60_000 });
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json().catch(() => ({})) as { username?: string; password?: string };
  const passwordOk = env.ADMIN_PASSWORD_HASH
    ? verifyAdminPassword(body.password ?? "", env.ADMIN_PASSWORD_HASH)
    : body.password === env.ADMIN_SYNC_TOKEN;

  if (body.username !== env.ADMIN_USERNAME || !passwordOk) {
    await logApp("warn", "admin-auth", "Failed admin login", { identifier });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName(), createAdminSession(body.username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  await logApp("info", "admin-auth", "Admin login succeeded", { identifier });
  return response;
}
