import type { ProviderName } from "@prisma/client";
import { prisma } from "@/lib/db";
import { startOfUtcDay } from "@/lib/date";

export async function incrementQuotaOrThrow(provider: ProviderName, limit?: number) {
  const day = startOfUtcDay();
  const current = await prisma.apiQuotaUsage.findUnique({
    where: { provider_day: { provider, day } }
  });

  if (limit && current && current.requests >= limit) {
    throw new Error(`${provider} daily quota exhausted for ${day.toISOString().slice(0, 10)}`);
  }

  return prisma.apiQuotaUsage.upsert({
    where: { provider_day: { provider, day } },
    update: { requests: { increment: 1 }, limit },
    create: { provider, day, requests: 1, limit }
  });
}
