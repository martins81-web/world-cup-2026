import { prisma } from "@/lib/db";

export async function checkPersistentRateLimit(input: {
  identifier: string;
  action: string;
  maxRequests?: number;
  windowMs?: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const maxRequests = input.maxRequests ?? 10;
  const windowMs = input.windowMs ?? 60_000;
  const existing = await prisma.adminRateLimit.findUnique({
    where: { identifier_action: { identifier: input.identifier, action: input.action } }
  });

  if (!existing || existing.resetAt <= now) {
    await prisma.adminRateLimit.upsert({
      where: { identifier_action: { identifier: input.identifier, action: input.action } },
      update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
      create: { identifier: input.identifier, action: input.action, count: 1, resetAt: new Date(now.getTime() + windowMs) }
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  await prisma.adminRateLimit.update({
    where: { id: existing.id },
    data: { count: { increment: 1 } }
  });
  return { allowed: true, remaining: maxRequests - existing.count - 1 };
}
