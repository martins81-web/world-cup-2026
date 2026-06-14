import { NextResponse } from "next/server";
import { logApp } from "@/lib/logger";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { message?: string; stack?: string; path?: string };
  await logApp("error", "client", body.message ?? "Client error", {
    stack: body.stack,
    path: body.path,
    release: process.env.NEXT_PUBLIC_RELEASE ?? "development",
    environment: process.env.NODE_ENV ?? "development"
  });
  return NextResponse.json({ ok: true });
}
