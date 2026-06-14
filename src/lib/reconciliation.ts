import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getReconciliationReport() {
  const [unmatchedTeams, unmatchedPlayers, duplicateTeamIds, duplicatePlayerIds, missingFixtures, invalidMappings, conflicts] = await Promise.all([
    prisma.providerMappingIssue.findMany({ where: { issueType: "unmatched-team", resolvedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.providerMappingIssue.findMany({ where: { issueType: "unmatched-player", resolvedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.$queryRaw<Array<{ apiFootballId: number; count: bigint }>>(Prisma.sql`SELECT "apiFootballId", COUNT(*)::bigint AS count FROM "Team" WHERE "apiFootballId" IS NOT NULL GROUP BY "apiFootballId" HAVING COUNT(*) > 1`),
    prisma.$queryRaw<Array<{ apiFootballId: number; count: bigint }>>(Prisma.sql`SELECT "apiFootballId", COUNT(*)::bigint AS count FROM "Player" WHERE "apiFootballId" IS NOT NULL GROUP BY "apiFootballId" HAVING COUNT(*) > 1`),
    prisma.providerMappingIssue.findMany({ where: { issueType: "missing-fixture", resolvedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.providerMappingIssue.findMany({ where: { issueType: { contains: "invalid" }, resolvedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.providerDataConflict.findMany({ where: { resolvedAt: null }, orderBy: { createdAt: "desc" } })
  ]);

  return { unmatchedTeams, unmatchedPlayers, duplicateTeamIds, duplicatePlayerIds, missingFixtures, invalidMappings, conflicts };
}

export async function getAdminDashboard() {
  const [users, issues, auditEvents, failedSyncs, logs] = await Promise.all([
    prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.providerMappingIssue.findMany({ where: { resolvedAt: null }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { adminUser: true } }),
    prisma.syncRun.findMany({ where: { status: "failed" }, orderBy: { startedAt: "desc" }, take: 10 }),
    prisma.appLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 })
  ]);
  return { users, issues, auditEvents, failedSyncs, logs };
}
