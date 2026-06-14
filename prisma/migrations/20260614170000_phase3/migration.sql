-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProviderName" AS ENUM ('API_FOOTBALL', 'THESPORTSDB');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'ADMIN', 'VIEWER');

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isSeedData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "fifaCode" TEXT,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "badgeUrl" TEXT,
    "apiFootballId" INTEGER,
    "sportsDbId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamTournament" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,

    CONSTRAINT "TeamTournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupTeam" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "GroupTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "providerId" TEXT,
    "matchNumber" INTEGER,
    "stage" TEXT NOT NULL,
    "stageOrder" INTEGER NOT NULL DEFAULT 0,
    "knockoutRound" TEXT,
    "groupName" TEXT,
    "kickoffAt" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "city" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeTeamId" TEXT,
    "awayTeamId" TEXT,
    "homeSeed" TEXT,
    "awaySeed" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "extraTimeHome" INTEGER,
    "extraTimeAway" INTEGER,
    "penaltyHome" INTEGER,
    "penaltyAway" INTEGER,
    "winnerToMatchId" TEXT,
    "winnerToSlot" TEXT,
    "loserToMatchId" TEXT,
    "loserToSlot" TEXT,
    "sourceProvider" "ProviderName",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "apiFootballId" INTEGER,
    "sportsDbId" TEXT,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "birthDate" TIMESTAMP(3),
    "age" INTEGER,
    "height" TEXT,
    "preferredFoot" TEXT,
    "position" TEXT,
    "club" TEXT,
    "nationality" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquadMembership" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "shirtNumber" INTEGER,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SquadMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStatistic" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT,
    "appearances" INTEGER,
    "minutes" INTEGER,
    "goals" INTEGER,
    "assists" INTEGER,
    "yellowCards" INTEGER,
    "redCards" INTEGER,
    "raw" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamStatistic" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "played" INTEGER,
    "won" INTEGER,
    "drawn" INTEGER,
    "lost" INTEGER,
    "goalsFor" INTEGER,
    "goalsAgainst" INTEGER,
    "raw" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchLineup" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT,
    "role" TEXT,
    "position" TEXT,
    "shirtNumber" INTEGER,
    "raw" JSONB,

    CONSTRAINT "MatchLineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT,
    "playerId" TEXT,
    "minute" INTEGER,
    "extraMinute" INTEGER,
    "type" TEXT NOT NULL,
    "detail" TEXT,
    "comments" TEXT,
    "providerEventId" TEXT,
    "raw" JSONB,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchStatistic" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT,
    "raw" JSONB,

    CONSTRAINT "MatchStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderMappingIssue" (
    "id" TEXT NOT NULL,
    "provider" "ProviderName" NOT NULL,
    "issueType" TEXT NOT NULL,
    "providerId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'warn',
    "message" TEXT NOT NULL,
    "raw" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderMappingIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderDataConflict" (
    "id" TEXT NOT NULL,
    "provider" "ProviderName" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "field" TEXT NOT NULL,
    "currentValue" TEXT,
    "incomingValue" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderDataConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualFieldLock" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "reason" TEXT,
    "teamId" TEXT,
    "playerId" TEXT,
    "matchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualFieldLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalApiCache" (
    "id" TEXT NOT NULL,
    "provider" "ProviderName" NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "response" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalApiCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiQuotaUsage" (
    "id" TEXT NOT NULL,
    "provider" "ProviderName" NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiQuotaUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRateLimit" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppLog" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "provider" "ProviderName" NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "message" TEXT,
    "matchesSeen" INTEGER NOT NULL DEFAULT 0,
    "teamsSeen" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Team_fifaCode_key" ON "Team"("fifaCode");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_apiFootballId_key" ON "Team"("apiFootballId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_sportsDbId_key" ON "Team"("sportsDbId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamTournament_teamId_tournamentId_key" ON "TeamTournament"("teamId", "tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_tournamentId_name_key" ON "Group"("tournamentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "GroupTeam_groupId_teamId_key" ON "GroupTeam"("groupId", "teamId");

-- CreateIndex
CREATE INDEX "Match_tournamentId_kickoffAt_idx" ON "Match"("tournamentId", "kickoffAt");

-- CreateIndex
CREATE INDEX "Match_winnerToMatchId_idx" ON "Match"("winnerToMatchId");

-- CreateIndex
CREATE INDEX "Match_loserToMatchId_idx" ON "Match"("loserToMatchId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_sourceProvider_providerId_key" ON "Match"("sourceProvider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_tournamentId_matchNumber_key" ON "Match"("tournamentId", "matchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Player_apiFootballId_key" ON "Player"("apiFootballId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_sportsDbId_key" ON "Player"("sportsDbId");

-- CreateIndex
CREATE INDEX "SquadMembership_teamId_idx" ON "SquadMembership"("teamId");

-- CreateIndex
CREATE INDEX "SquadMembership_playerId_idx" ON "SquadMembership"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "SquadMembership_tournamentId_teamId_playerId_key" ON "SquadMembership"("tournamentId", "teamId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStatistic_tournamentId_playerId_key" ON "PlayerStatistic"("tournamentId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamStatistic_tournamentId_teamId_key" ON "TeamStatistic"("tournamentId", "teamId");

-- CreateIndex
CREATE INDEX "MatchLineup_matchId_idx" ON "MatchLineup"("matchId");

-- CreateIndex
CREATE INDEX "MatchEvent_matchId_idx" ON "MatchEvent"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchStatistic_matchId_teamId_type_key" ON "MatchStatistic"("matchId", "teamId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ProviderMappingIssue_provider_issueType_idx" ON "ProviderMappingIssue"("provider", "issueType");

-- CreateIndex
CREATE INDEX "ProviderMappingIssue_resolvedAt_idx" ON "ProviderMappingIssue"("resolvedAt");

-- CreateIndex
CREATE INDEX "ProviderDataConflict_entityType_entityId_idx" ON "ProviderDataConflict"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ProviderDataConflict_resolvedAt_idx" ON "ProviderDataConflict"("resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ManualFieldLock_entityType_entityId_field_key" ON "ManualFieldLock"("entityType", "entityId", "field");

-- CreateIndex
CREATE INDEX "ExternalApiCache_expiresAt_idx" ON "ExternalApiCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalApiCache_provider_cacheKey_key" ON "ExternalApiCache"("provider", "cacheKey");

-- CreateIndex
CREATE UNIQUE INDEX "ApiQuotaUsage_provider_day_key" ON "ApiQuotaUsage"("provider", "day");

-- CreateIndex
CREATE INDEX "AdminRateLimit_resetAt_idx" ON "AdminRateLimit"("resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRateLimit_identifier_action_key" ON "AdminRateLimit"("identifier", "action");

-- CreateIndex
CREATE INDEX "AppLog_level_createdAt_idx" ON "AppLog"("level", "createdAt");

-- CreateIndex
CREATE INDEX "AppLog_scope_createdAt_idx" ON "AppLog"("scope", "createdAt");

-- AddForeignKey
ALTER TABLE "TeamTournament" ADD CONSTRAINT "TeamTournament_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamTournament" ADD CONSTRAINT "TeamTournament_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupTeam" ADD CONSTRAINT "GroupTeam_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupTeam" ADD CONSTRAINT "GroupTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerToMatchId_fkey" FOREIGN KEY ("winnerToMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_loserToMatchId_fkey" FOREIGN KEY ("loserToMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadMembership" ADD CONSTRAINT "SquadMembership_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadMembership" ADD CONSTRAINT "SquadMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadMembership" ADD CONSTRAINT "SquadMembership_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStatistic" ADD CONSTRAINT "PlayerStatistic_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStatistic" ADD CONSTRAINT "PlayerStatistic_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStatistic" ADD CONSTRAINT "PlayerStatistic_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStatistic" ADD CONSTRAINT "TeamStatistic_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStatistic" ADD CONSTRAINT "TeamStatistic_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineup" ADD CONSTRAINT "MatchLineup_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineup" ADD CONSTRAINT "MatchLineup_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineup" ADD CONSTRAINT "MatchLineup_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchStatistic" ADD CONSTRAINT "MatchStatistic_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchStatistic" ADD CONSTRAINT "MatchStatistic_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualFieldLock" ADD CONSTRAINT "ManualFieldLock_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualFieldLock" ADD CONSTRAINT "ManualFieldLock_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualFieldLock" ADD CONSTRAINT "ManualFieldLock_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

