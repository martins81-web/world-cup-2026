import { describe, expect, it } from "vitest";

const runIntegration = Boolean(process.env.TEST_DATABASE_URL);
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration("PostgreSQL integration", () => {
  it("queries tournament data through Prisma", async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const { prisma } = await import("@/lib/db");
    await expect(prisma.tournament.findMany({ take: 1 })).resolves.toBeInstanceOf(Array);
  });

  it("can persist admin rate limit buckets", async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const { checkPersistentRateLimit } = await import("@/lib/admin-rate-limit");
    await expect(checkPersistentRateLimit({ identifier: "integration", action: "sync" })).resolves.toMatchObject({ allowed: true });
  });

  it("can import synchronization services against the database client", async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const service = await import("@/lib/sync/synchronization-service");
    expect(typeof service.synchronizeAllProviders).toBe("function");
  });
});
