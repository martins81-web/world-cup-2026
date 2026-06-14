import { adminCookieName, verifyAdminSession } from "@/lib/admin-auth";
import { env } from "@/lib/env";

export function getRequestIdentifier(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export function hasAdminAccess(request: Request) {
  const token = request.headers.get("x-admin-sync-token");
  if (token && token === env.ADMIN_SYNC_TOKEN) return true;
  const authorization = request.headers.get("authorization");
  if (env.CRON_SECRET && authorization === `Bearer ${env.CRON_SECRET}`) return true;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${adminCookieName()}=`));
  const session = cookie ? decodeURIComponent(cookie.slice(adminCookieName().length + 1)) : null;
  return verifyAdminSession(session);
}
