import { NextResponse } from "next/server";
import { checkPersistentRateLimit } from "@/lib/admin-rate-limit";
import { getRequestIdentifier, hasAdminAccess } from "@/lib/admin-request";
import { logApp } from "@/lib/logger";
import { synchronizeAllProviders } from "@/lib/sync/synchronization-service";

export async function POST(request: Request) {
  const identifier = getRequestIdentifier(request);
  const limit = await checkPersistentRateLimit({ identifier, action: "admin-sync", maxRequests: 5, windowMs: 60_000 });
  if (!limit.allowed) {
    await logApp("warn", "admin-sync", "Rate limited sync request", { identifier });
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  if (!hasAdminAccess(request)) {
    await logApp("warn", "admin-sync", "Unauthorized sync request", { identifier });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await synchronizeAllProviders();
  await logApp("info", "admin-sync", "Admin synchronization completed", { results });
  return NextResponse.json({ results });
}
