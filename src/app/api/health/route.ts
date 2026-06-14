import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logApp } from "@/lib/logger";

export async function GET() {
  const checks = {
    app: "ok",
    database: "unknown",
    apiFootball: env.API_FOOTBALL_KEY ? "configured" : "not configured"
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
    await logApp("error", "health", "Database health check failed");
  }

  const ok = checks.database === "ok";
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
