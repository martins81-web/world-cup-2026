import type { ProviderName } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { incrementQuotaOrThrow } from "@/lib/quota";

type CachedFetchOptions = {
  provider: ProviderName;
  cacheKey: string;
  url: string;
  headers?: HeadersInit;
  quotaLimit?: number;
};

export async function cachedJsonFetch<T>(options: CachedFetchOptions): Promise<T> {
  const cached = await prisma.externalApiCache.findUnique({
    where: { provider_cacheKey: { provider: options.provider, cacheKey: options.cacheKey } }
  });

  if (cached && cached.expiresAt > new Date()) {
    return cached.response as T;
  }

  await incrementQuotaOrThrow(options.provider, options.quotaLimit);

  const response = await fetch(options.url, {
    headers: options.headers,
    next: { revalidate: env.EXTERNAL_API_CACHE_TTL_SECONDS }
  });
  const body = (await response.json()) as T;

  await prisma.externalApiCache.upsert({
    where: { provider_cacheKey: { provider: options.provider, cacheKey: options.cacheKey } },
    update: {
      statusCode: response.status,
      response: body as Prisma.InputJsonValue,
      expiresAt: new Date(Date.now() + env.EXTERNAL_API_CACHE_TTL_SECONDS * 1000)
    },
    create: {
      provider: options.provider,
      cacheKey: options.cacheKey,
      statusCode: response.status,
      response: body as Prisma.InputJsonValue,
      expiresAt: new Date(Date.now() + env.EXTERNAL_API_CACHE_TTL_SECONDS * 1000)
    }
  });

  if (!response.ok) {
    throw new Error(`${options.provider} request failed with HTTP ${response.status}`);
  }

  return body;
}
