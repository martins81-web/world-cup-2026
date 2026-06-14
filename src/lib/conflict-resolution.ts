import { ProviderName } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function resolveMappingIssue(input: {
  issueId: string;
  action: "map-team" | "map-player" | "ignore";
  localEntityId?: string;
}) {
  const issue = await prisma.providerMappingIssue.findUniqueOrThrow({ where: { id: input.issueId } });
  if (input.action === "ignore") {
    await prisma.providerMappingIssue.update({ where: { id: issue.id }, data: { resolvedAt: new Date() } });
  }
  if (input.action === "map-team" && input.localEntityId && issue.provider === ProviderName.API_FOOTBALL && issue.providerId) {
    await prisma.team.update({ where: { id: input.localEntityId }, data: { apiFootballId: Number(issue.providerId) } });
    await prisma.providerMappingIssue.update({ where: { id: issue.id }, data: { entityType: "Team", entityId: input.localEntityId, resolvedAt: new Date() } });
  }
  if (input.action === "map-player" && input.localEntityId && issue.provider === ProviderName.API_FOOTBALL && issue.providerId) {
    await prisma.player.update({ where: { id: input.localEntityId }, data: { apiFootballId: Number(issue.providerId) } });
    await prisma.providerMappingIssue.update({ where: { id: issue.id }, data: { entityType: "Player", entityId: input.localEntityId, resolvedAt: new Date() } });
  }
  await prisma.auditEvent.create({ data: { action: `mapping-${input.action}`, entityType: issue.entityType, entityId: input.localEntityId, metadata: { issueId: issue.id } } });
}

export async function resolveConflict(input: { conflictId: string; action: "accept-provider" | "keep-local" }) {
  const conflict = await prisma.providerDataConflict.findUniqueOrThrow({ where: { id: input.conflictId } });
  if (input.action === "accept-provider" && conflict.entityId) {
    if (conflict.entityType === "Team") {
      await prisma.team.update({ where: { id: conflict.entityId }, data: { [conflict.field]: conflict.incomingValue } });
    }
    if (conflict.entityType === "Player") {
      await prisma.player.update({ where: { id: conflict.entityId }, data: { [conflict.field]: conflict.incomingValue } });
    }
  }
  await prisma.providerDataConflict.update({ where: { id: conflict.id }, data: { resolvedAt: new Date() } });
  await prisma.auditEvent.create({ data: { action: `conflict-${input.action}`, entityType: conflict.entityType, entityId: conflict.entityId, metadata: { conflictId: conflict.id, field: conflict.field } } });
}

export async function mergeDuplicate(input: { entityType: "Team" | "Player"; sourceId: string; targetId: string }) {
  if (input.entityType === "Player") {
    await prisma.squadMembership.updateMany({ where: { playerId: input.sourceId }, data: { playerId: input.targetId } });
    await prisma.playerStatistic.updateMany({ where: { playerId: input.sourceId }, data: { playerId: input.targetId } });
    await prisma.player.delete({ where: { id: input.sourceId } });
  }
  if (input.entityType === "Team") {
    await prisma.squadMembership.updateMany({ where: { teamId: input.sourceId }, data: { teamId: input.targetId } });
    await prisma.teamStatistic.updateMany({ where: { teamId: input.sourceId }, data: { teamId: input.targetId } });
    await prisma.team.delete({ where: { id: input.sourceId } });
  }
  await prisma.auditEvent.create({ data: { action: "duplicate-merged", entityType: input.entityType, entityId: input.targetId, metadata: { sourceId: input.sourceId } } });
}
