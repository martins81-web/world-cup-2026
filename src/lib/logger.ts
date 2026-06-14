import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logApp(level: "info" | "warn" | "error", scope: string, message: string, metadata?: Prisma.InputJsonValue) {
  const line = `[${level}] ${scope}: ${message}`;
  if (level === "error") console.error(line, metadata ?? "");
  else if (level === "warn") console.warn(line, metadata ?? "");
  else console.info(line, metadata ?? "");

  try {
    await prisma.appLog.create({ data: { level, scope, message, metadata } });
  } catch {
    // Logging must never break request handling or sync jobs.
  }
}
