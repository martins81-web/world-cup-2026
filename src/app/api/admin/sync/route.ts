import { NextResponse } from "next/server";
import { checkPersistentRateLimit } from "@/lib/admin-rate-limit";
import { getRequestIdentifier, hasAdminAccess } from "@/lib/admin-request";
import { logApp } from "@/lib/logger";
import { WorldCup2026OpenSourceProvider } from "@/lib/providers/worldcup2026";
import { isWithinMontrealResultSyncWindow, montrealSyncWindowLabel } from "@/lib/sync/schedule";
import { synchronizeAllProviders, synchronizeProvider } from "@/lib/sync/synchronization-service";

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

export async function GET(request: Request) {
  if (!hasAdminAccess(request)) {
    await logApp("warn", "scheduled-sync", "Unauthorized scheduled sync request", { identifier: getRequestIdentifier(request) });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isWithinMontrealResultSyncWindow()) {
    const message = `Scheduled score sync skipped outside ${montrealSyncWindowLabel()}.`;
    await logApp("info", "scheduled-sync", message);
    return NextResponse.json({ results: [], status: "skipped", message });
  }

  const result = await synchronizeProvider(new WorldCup2026OpenSourceProvider());
  await logApp("info", "scheduled-sync", "Scheduled World Cup 2026 synchronization completed", { result });
  return NextResponse.json({ results: [result] });
}
