import { Prisma, ProviderName } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ApiFootballProvider } from "@/lib/providers/api-football";
import { TheSportsDbProvider } from "@/lib/providers/thesportsdb";
import { WorldCup2026OpenSourceProvider } from "@/lib/providers/worldcup2026";
import { logApp } from "@/lib/logger";
import { sendSyncFailureAlert } from "@/lib/monitoring";
import type { FootballProvider, ProviderEvent, ProviderLineup, ProviderMatch, ProviderMatchStatistic, ProviderPlayer, ProviderStadium, ProviderTeam, ProviderTeamStatistic } from "@/lib/providers/types";

export type SyncResult = {
  provider: ProviderName;
  status: "skipped" | "success" | "partial" | "failed";
  message: string;
  teamsSeen: number;
  matchesSeen: number;
  groupsSeen: number;
  stadiumsSeen: number;
  source?: string;
  errors?: string[];
};

const TOURNAMENT_SLUG = "world-cup-2026";

async function upsertTeam(team: ProviderTeam) {
  const providerField =
    team.provider === ProviderName.API_FOOTBALL ? { apiFootballId: Number(team.providerId) } :
      team.provider === ProviderName.THESPORTSDB ? { sportsDbId: team.providerId } :
        { worldcup2026Id: team.providerId };
  const existing = await findTeam(team.provider, team.providerId) ?? await findTeamByStaticIdentity(team);
  if (existing && existing.name !== team.name) {
    await prisma.providerDataConflict.create({
      data: { provider: team.provider, entityType: "Team", entityId: existing.id, field: "name", currentValue: existing.name, incomingValue: team.name }
    });
  }
  if (existing) {
    if (team.provider === ProviderName.API_FOOTBALL) {
      return prisma.team.update({
        where: { id: existing.id },
        data: {
          apiFootballId: Number(team.providerId),
          badgeUrl: existing.badgeUrl ?? team.badgeUrl
        }
      });
    }

    return prisma.team.update({
      where: { id: existing.id },
      data: {
        name: team.name,
        country: team.country,
        fifaCode: team.fifaCode,
        badgeUrl: team.badgeUrl,
        ...providerField
      }
    });
  }

  return prisma.team.create({
    data: {
      name: team.name,
      country: team.country,
      fifaCode: team.fifaCode,
      badgeUrl: team.badgeUrl,
      ...providerField
    }
  });
}

async function recordMappingIssue(provider: ProviderName, issueType: string, message: string, data: Record<string, unknown>) {
  await prisma.providerMappingIssue.create({
    data: {
      provider,
      issueType,
      providerId: data.providerId ? String(data.providerId) : undefined,
      entityType: data.entityType ? String(data.entityType) : undefined,
      entityId: data.entityId ? String(data.entityId) : undefined,
      message,
      raw: data as Prisma.InputJsonValue
    }
  });
  await logApp("warn", "reconciliation", message, data as Prisma.InputJsonValue);
}

async function findTeam(provider: ProviderName, providerId?: string) {
  if (!providerId) return null;
  if (provider === ProviderName.API_FOOTBALL) return prisma.team.findUnique({ where: { apiFootballId: Number(providerId) } });
  if (provider === ProviderName.THESPORTSDB) return prisma.team.findUnique({ where: { sportsDbId: providerId } });
  return prisma.team.findUnique({ where: { worldcup2026Id: providerId } });
}

async function findTeamByStaticIdentity(team: ProviderTeam) {
  const direct = await prisma.team.findFirst({
    where: {
      OR: [
        ...(team.fifaCode ? [{ fifaCode: team.fifaCode }] : []),
        { name: team.name }
      ]
    }
  });
  if (direct) return direct;

  const teams = await prisma.team.findMany();
  const incomingName = normalizeFootballName(team.name);
  return teams.find((candidate) => normalizeFootballName(candidate.name) === incomingName) ?? null;
}

async function findMatch(provider: ProviderName, providerId: string) {
  if (provider === ProviderName.API_FOOTBALL) {
    return prisma.match.findUnique({ where: { apiFootballFixtureId: Number(providerId) } });
  }
  return prisma.match.findUnique({ where: { sourceProvider_providerId: { sourceProvider: provider, providerId } } });
}

async function findExistingMatchForProviderMatch(provider: ProviderName, tournamentId: string, match: ProviderMatch, homeTeamId?: string, awayTeamId?: string) {
  if (provider !== ProviderName.API_FOOTBALL) return null;

  const mapped = await prisma.match.findUnique({ where: { apiFootballFixtureId: Number(match.providerId) } });
  if (mapped) return mapped;
  if (!homeTeamId || !awayTeamId) return null;

  const byTeams = await prisma.match.findFirst({
    where: {
      tournamentId,
      homeTeamId,
      awayTeamId,
      sourceProvider: ProviderName.WORLDCUP2026_OPEN_SOURCE
    },
    orderBy: [{ kickoffAt: "asc" }]
  });
  if (byTeams) return byTeams;

  const byTeamsReverse = await prisma.match.findFirst({
    where: {
      tournamentId,
      homeTeamId: awayTeamId,
      awayTeamId: homeTeamId,
      sourceProvider: ProviderName.WORLDCUP2026_OPEN_SOURCE
    },
    orderBy: [{ kickoffAt: "asc" }]
  });
  return byTeamsReverse;
}

async function upsertPlayer(player: ProviderPlayer) {
  const providerField = player.provider === ProviderName.API_FOOTBALL ? { apiFootballId: Number(player.providerId) } : { sportsDbId: player.providerId };
  const existing = player.provider === ProviderName.API_FOOTBALL
    ? await prisma.player.findUnique({ where: { apiFootballId: Number(player.providerId) } })
    : await prisma.player.findUnique({ where: { sportsDbId: player.providerId } });
  if (existing && existing.name !== player.name) {
    await prisma.providerDataConflict.create({
      data: { provider: player.provider, entityType: "Player", entityId: existing.id, field: "name", currentValue: existing.name, incomingValue: player.name }
    });
  }
  return prisma.player.upsert({
    where: player.provider === ProviderName.API_FOOTBALL ? { apiFootballId: Number(player.providerId) } : { sportsDbId: player.providerId },
    update: {
      name: player.name,
      photoUrl: player.photoUrl,
      age: player.age,
      height: player.height,
      preferredFoot: player.preferredFoot,
      position: player.position,
      club: player.club,
      nationality: player.nationality,
      ...providerField
    },
    create: {
      name: player.name,
      photoUrl: player.photoUrl,
      age: player.age,
      height: player.height,
      preferredFoot: player.preferredFoot,
      position: player.position,
      club: player.club,
      nationality: player.nationality,
      ...providerField
    }
  });
}

async function ingestPlayerStatistics(tournamentId: string, player: ProviderPlayer) {
  const dbPlayer = await upsertPlayer(player);
  const team = await findTeam(player.provider, player.teamProviderId);
  await prisma.playerStatistic.upsert({
    where: { tournamentId_playerId: { tournamentId, playerId: dbPlayer.id } },
    update: {
      teamId: team?.id,
      appearances: player.appearances,
      minutes: player.minutes,
      goals: player.goals,
      assists: player.assists,
      yellowCards: player.yellowCards,
      redCards: player.redCards,
      raw: player.raw as Prisma.InputJsonValue
    },
    create: {
      tournamentId,
      playerId: dbPlayer.id,
      teamId: team?.id,
      appearances: player.appearances,
      minutes: player.minutes,
      goals: player.goals,
      assists: player.assists,
      yellowCards: player.yellowCards,
      redCards: player.redCards,
      raw: player.raw as Prisma.InputJsonValue
    }
  });
}

async function ingestLineup(provider: ProviderName, lineup: ProviderLineup) {
  const match = await findMatch(provider, lineup.matchProviderId);
  const team = await findTeam(provider, lineup.teamProviderId);
  if (!match || !team) {
    await recordMappingIssue(provider, "invalid-lineup-mapping", "Lineup could not be mapped to a stored match and team.", { providerId: lineup.matchProviderId, teamProviderId: lineup.teamProviderId });
    return;
  }
  const player = lineup.playerProviderId ? await upsertPlayer({ provider, providerId: lineup.playerProviderId, name: lineup.playerName ?? "Unknown player", position: lineup.position, shirtNumber: lineup.shirtNumber }) : null;
  await prisma.matchLineup.create({
    data: {
      matchId: match.id,
      teamId: team.id,
      playerId: player?.id,
      role: lineup.role,
      position: lineup.position,
      shirtNumber: lineup.shirtNumber,
      raw: lineup.raw as Prisma.InputJsonValue
    }
  });
}

async function ingestEvent(provider: ProviderName, event: ProviderEvent) {
  const match = await findMatch(provider, event.matchProviderId);
  if (!match) {
    await recordMappingIssue(provider, "invalid-event-mapping", "Event could not be mapped to a stored match.", { providerId: event.matchProviderId });
    return;
  }
  const team = await findTeam(provider, event.teamProviderId);
  const player = event.playerProviderId ? await upsertPlayer({ provider, providerId: event.playerProviderId, name: event.playerName ?? "Unknown player" }) : null;
  await prisma.matchEvent.create({
    data: {
      matchId: match.id,
      teamId: team?.id,
      playerId: player?.id,
      minute: event.minute,
      extraMinute: event.extraMinute,
      type: event.type,
      detail: event.detail,
      comments: event.comments,
      providerEventId: event.providerEventId,
      raw: event.raw as Prisma.InputJsonValue
    }
  });
}

async function ingestMatchStatistic(provider: ProviderName, statistic: ProviderMatchStatistic) {
  const match = await findMatch(provider, statistic.matchProviderId);
  const team = await findTeam(provider, statistic.teamProviderId);
  if (!match || !team) {
    await recordMappingIssue(provider, "invalid-statistic-mapping", "Match statistic could not be mapped to a stored match and team.", { providerId: statistic.matchProviderId, teamProviderId: statistic.teamProviderId });
    return;
  }
  await prisma.matchStatistic.upsert({
    where: { matchId_teamId_type: { matchId: match.id, teamId: team.id, type: statistic.type } },
    update: { value: statistic.value, raw: statistic.raw as Prisma.InputJsonValue },
    create: { matchId: match.id, teamId: team.id, type: statistic.type, value: statistic.value, raw: statistic.raw as Prisma.InputJsonValue }
  });
}

async function ingestTeamStatistic(provider: ProviderName, tournamentId: string, statistic: ProviderTeamStatistic) {
  const team = await findTeam(provider, statistic.teamProviderId);
  if (!team) {
    await recordMappingIssue(provider, "unmatched-team-statistic", "Team statistic could not be mapped to a stored team.", { providerId: statistic.teamProviderId });
    return;
  }
  await prisma.teamStatistic.upsert({
    where: { tournamentId_teamId: { tournamentId, teamId: team.id } },
    update: { played: statistic.played, won: statistic.won, drawn: statistic.drawn, lost: statistic.lost, goalsFor: statistic.goalsFor, goalsAgainst: statistic.goalsAgainst, raw: statistic.raw as Prisma.InputJsonValue },
    create: { tournamentId, teamId: team.id, played: statistic.played, won: statistic.won, drawn: statistic.drawn, lost: statistic.lost, goalsFor: statistic.goalsFor, goalsAgainst: statistic.goalsAgainst, raw: statistic.raw as Prisma.InputJsonValue }
  });
}

async function upsertStadium(stadium: ProviderStadium) {
  return prisma.stadium.upsert({
    where: { worldcup2026Id: stadium.providerId },
    update: {
      name: stadium.name,
      fifaName: stadium.fifaName,
      city: stadium.city,
      country: stadium.country,
      capacity: stadium.capacity,
      region: stadium.region
    },
    create: {
      worldcup2026Id: stadium.providerId,
      name: stadium.name,
      fifaName: stadium.fifaName,
      city: stadium.city,
      country: stadium.country,
      capacity: stadium.capacity,
      region: stadium.region
    }
  });
}

export async function synchronizeProvider(provider: FootballProvider): Promise<SyncResult> {
  await prisma.syncRun.updateMany({
    where: {
      provider: provider.name,
      status: "running",
      startedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) }
    },
    data: {
      status: "failed",
      finishedAt: new Date(),
      message: "Marked failed because the sync run did not finish within 10 minutes."
    }
  });

  if (!provider.isConfigured()) {
    const message = getProviderConfigurationMessage(provider);
    await prisma.syncRun.create({
      data: {
        provider: provider.name,
        status: "skipped",
        finishedAt: new Date(),
        message,
        source: provider.source,
        errors: provider.errors as Prisma.InputJsonValue
      }
    });
    return { provider: provider.name, status: "skipped", message, teamsSeen: 0, matchesSeen: 0, groupsSeen: 0, stadiumsSeen: 0, source: provider.source, errors: provider.errors };
  }

  if (provider.syncEnrichmentOnly) {
    const run = await prisma.syncRun.create({ data: { provider: provider.name, status: "running", source: provider.source } });
    try {
      const result = await provider.syncEnrichmentOnly();
      await prisma.syncRun.update({
        where: { id: run.id },
        data: {
          status: result.status,
          finishedAt: new Date(),
          message: result.message,
          teamsSeen: result.teamsSeen,
          matchesSeen: result.matchesSeen,
          groupsSeen: result.groupsSeen ?? 0,
          stadiumsSeen: result.stadiumsSeen ?? 0,
          source: result.source ?? provider.source,
          errors: result.errors as Prisma.InputJsonValue
        }
      });
      if (result.status === "failed") await sendSyncFailureAlert({ provider: provider.name, message: result.message, syncRunId: run.id });
      return {
        provider: provider.name,
        status: result.status,
        message: result.message,
        teamsSeen: result.teamsSeen,
        matchesSeen: result.matchesSeen,
        groupsSeen: result.groupsSeen ?? 0,
        stadiumsSeen: result.stadiumsSeen ?? 0,
        source: result.source ?? provider.source,
        errors: result.errors
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown enrichment synchronization error";
      await prisma.syncRun.update({ where: { id: run.id }, data: { status: "failed", finishedAt: new Date(), message, source: provider.source } });
      await logApp("error", "sync", "Provider enrichment failed", { provider: provider.name, message });
      await sendSyncFailureAlert({ provider: provider.name, message, syncRunId: run.id });
      return { provider: provider.name, status: "failed", message, teamsSeen: 0, matchesSeen: 0, groupsSeen: 0, stadiumsSeen: 0, source: provider.source, errors: provider.errors };
    }
  }

  const run = await prisma.syncRun.create({ data: { provider: provider.name, status: "running" } });

  try {
    const tournament = await prisma.tournament.upsert({
      where: { slug: TOURNAMENT_SLUG },
      update: { isSeedData: false },
      create: {
        slug: TOURNAMENT_SLUG,
        name: "FIFA World Cup 2026",
        season: 2026,
        startsAt: new Date("2026-06-11T00:00:00Z"),
        endsAt: new Date("2026-07-19T23:59:59Z"),
        isSeedData: false
      }
    });

    const [teams, groups, stadiums] = await Promise.all([
      provider.getWorldCupTeams(),
      provider.getWorldCupGroups ? provider.getWorldCupGroups() : Promise.resolve([]),
      provider.getWorldCupStadiums ? provider.getWorldCupStadiums() : Promise.resolve([])
    ]);

    if (teams.length === 0) {
      const message = "Provider returned zero teams; existing data was retained.";
      await prisma.syncRun.update({
        where: { id: run.id },
        data: { status: "skipped", finishedAt: new Date(), message, source: provider.source, errors: provider.errors as Prisma.InputJsonValue }
      });
      return { provider: provider.name, status: "skipped", message, teamsSeen: 0, matchesSeen: 0, groupsSeen: 0, stadiumsSeen: 0, source: provider.source, errors: provider.errors };
    }

    for (const team of teams) {
      const dbTeam = await upsertTeam(team);
      await prisma.teamTournament.upsert({
        where: { teamId_tournamentId: { teamId: dbTeam.id, tournamentId: tournament.id } },
        update: {},
        create: { teamId: dbTeam.id, tournamentId: tournament.id }
      });
    }

    for (const stadium of stadiums) {
      await upsertStadium(stadium);
    }

    for (const group of groups) {
      const dbGroup = await prisma.group.upsert({
        where: { tournamentId_name: { tournamentId: tournament.id, name: group.name } },
        update: {},
        create: { tournamentId: tournament.id, name: group.name }
      });
      for (const providerId of group.teamProviderIds) {
        const team = await findTeam(provider.name, providerId);
        if (!team) continue;
        await prisma.groupTeam.upsert({
          where: { groupId_teamId: { groupId: dbGroup.id, teamId: team.id } },
          update: {},
          create: { groupId: dbGroup.id, teamId: team.id }
        });
      }
    }

    const matches = await provider.getWorldCupMatches();
    if (matches.length === 0) {
      const message = "Provider returned zero matches; existing data was retained.";
      await prisma.syncRun.update({
        where: { id: run.id },
        data: { status: "skipped", finishedAt: new Date(), message, teamsSeen: teams.length, groupsSeen: groups.length, stadiumsSeen: stadiums.length, source: provider.source, errors: provider.errors as Prisma.InputJsonValue }
      });
      return { provider: provider.name, status: "skipped", message, teamsSeen: teams.length, matchesSeen: 0, groupsSeen: groups.length, stadiumsSeen: stadiums.length, source: provider.source, errors: provider.errors };
    }

    if (
      provider.name === ProviderName.WORLDCUP2026_OPEN_SOURCE &&
      provider.source &&
      provider.source !== "hosted API partial"
    ) {
      const existingMatches = await prisma.match.count({ where: { tournamentId: tournament.id } });
      if (existingMatches > 0) {
        const message = "No fresh hosted match payload was available; existing match results were retained.";
        await prisma.syncRun.update({
          where: { id: run.id },
          data: {
            status: "skipped",
            finishedAt: new Date(),
            message,
            teamsSeen: teams.length,
            matchesSeen: matches.length,
            groupsSeen: groups.length,
            stadiumsSeen: stadiums.length,
            source: provider.source,
            errors: provider.errors as Prisma.InputJsonValue
          }
        });
        return { provider: provider.name, status: "skipped", message, teamsSeen: teams.length, matchesSeen: matches.length, groupsSeen: groups.length, stadiumsSeen: stadiums.length, source: provider.source, errors: provider.errors };
      }
    }

    for (const match of matches) {
      const homeTeam = match.homeTeam ? await upsertTeam(match.homeTeam) : null;
      const awayTeam = match.awayTeam ? await upsertTeam(match.awayTeam) : null;
      const stadium = match.stadiumProviderId ? await prisma.stadium.findUnique({ where: { worldcup2026Id: match.stadiumProviderId } }) : null;
      const existingMatch = await findExistingMatchForProviderMatch(provider.name, tournament.id, match, homeTeam?.id, awayTeam?.id);
      if (existingMatch) {
        await prisma.match.update({
          where: { id: existingMatch.id },
          data: {
            apiFootballFixtureId: Number(match.providerId),
            stage: match.stage,
            stageOrder: match.stageOrder ?? existingMatch.stageOrder,
            knockoutRound: match.knockoutRound ?? existingMatch.knockoutRound,
            groupName: match.groupName ?? existingMatch.groupName,
            kickoffAt: match.kickoffAt,
            venue: match.venue ?? existingMatch.venue,
            city: match.city ?? existingMatch.city,
            status: match.status,
            homeTeamId: homeTeam?.id ?? existingMatch.homeTeamId,
            awayTeamId: awayTeam?.id ?? existingMatch.awayTeamId,
            stadiumId: stadium?.id ?? existingMatch.stadiumId,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            extraTimeHome: match.extraTimeHome,
            extraTimeAway: match.extraTimeAway,
            penaltyHome: match.penaltyHome,
            penaltyAway: match.penaltyAway
          }
        });
        continue;
      }

      await prisma.match.upsert({
        where: { sourceProvider_providerId: { sourceProvider: match.provider, providerId: match.providerId } },
        update: {
          ...(provider.name === ProviderName.API_FOOTBALL ? { apiFootballFixtureId: Number(match.providerId) } : {}),
          stage: match.stage,
          matchNumber: match.matchNumber,
          stageOrder: match.stageOrder ?? 0,
          knockoutRound: match.knockoutRound,
          groupName: match.groupName,
          kickoffAt: match.kickoffAt,
          venue: match.venue,
          city: match.city,
          status: match.status,
          homeTeamId: homeTeam?.id,
          awayTeamId: awayTeam?.id,
          stadiumId: stadium?.id,
          homeSeed: match.homeSeed,
          awaySeed: match.awaySeed,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          extraTimeHome: match.extraTimeHome,
          extraTimeAway: match.extraTimeAway,
          penaltyHome: match.penaltyHome,
          penaltyAway: match.penaltyAway
        },
        create: {
          tournamentId: tournament.id,
          sourceProvider: match.provider,
          providerId: match.providerId,
          apiFootballFixtureId: provider.name === ProviderName.API_FOOTBALL ? Number(match.providerId) : undefined,
          matchNumber: match.matchNumber,
          stage: match.stage,
          stageOrder: match.stageOrder ?? 0,
          knockoutRound: match.knockoutRound,
          groupName: match.groupName,
          kickoffAt: match.kickoffAt,
          venue: match.venue,
          city: match.city,
          status: match.status,
          homeTeamId: homeTeam?.id,
          awayTeamId: awayTeam?.id,
          stadiumId: stadium?.id,
          homeSeed: match.homeSeed,
          awaySeed: match.awaySeed,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          extraTimeHome: match.extraTimeHome,
          extraTimeAway: match.extraTimeAway,
          penaltyHome: match.penaltyHome,
          penaltyAway: match.penaltyAway
        }
      });
    }

    if (provider.getWorldCupSquads) {
      const squads = await provider.getWorldCupSquads();
      for (const squad of squads) {
        const team = await findTeam(provider.name, squad.teamProviderId);
        if (!team) {
          await recordMappingIssue(provider.name, "unmatched-team", "Squad team could not be matched.", { providerId: squad.teamProviderId, entityType: "Team" });
          continue;
        }
        for (const player of squad.players) {
          const dbPlayer = await upsertPlayer(player);
          await prisma.squadMembership.upsert({
            where: { tournamentId_teamId_playerId: { tournamentId: tournament.id, teamId: team.id, playerId: dbPlayer.id } },
            update: { shirtNumber: player.shirtNumber, position: player.position },
            create: { tournamentId: tournament.id, teamId: team.id, playerId: dbPlayer.id, shirtNumber: player.shirtNumber, position: player.position }
          });
        }
      }
    }

    if (provider.getWorldCupPlayers) {
      for (const player of await provider.getWorldCupPlayers()) {
        await ingestPlayerStatistics(tournament.id, player);
      }
    }

    if (provider.getWorldCupLineups) {
      await prisma.matchLineup.deleteMany({ where: { match: { sourceProvider: provider.name } } });
      for (const lineup of await provider.getWorldCupLineups()) await ingestLineup(provider.name, lineup);
    }

    if (provider.getWorldCupEvents) {
      await prisma.matchEvent.deleteMany({ where: { match: { sourceProvider: provider.name } } });
      for (const event of await provider.getWorldCupEvents()) await ingestEvent(provider.name, event);
    }

    if (provider.getWorldCupMatchStatistics) {
      await prisma.matchStatistic.deleteMany({ where: { match: { sourceProvider: provider.name } } });
      for (const statistic of await provider.getWorldCupMatchStatistics()) await ingestMatchStatistic(provider.name, statistic);
    }

    if (provider.getWorldCupTeamStatistics) {
      for (const statistic of await provider.getWorldCupTeamStatistics()) await ingestTeamStatistic(provider.name, tournament.id, statistic);
    }

    const status = provider.errors && provider.errors.length > 0 ? "partial" : "success";
    const message = status === "partial" ? "Synchronization completed with fallback/errors." : "Synchronization completed.";
    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status,
        finishedAt: new Date(),
        teamsSeen: teams.length,
        matchesSeen: matches.length,
        groupsSeen: groups.length,
        stadiumsSeen: stadiums.length,
        source: provider.source,
        message,
        errors: provider.errors as Prisma.InputJsonValue
      }
    });

    return { provider: provider.name, status, message, teamsSeen: teams.length, matchesSeen: matches.length, groupsSeen: groups.length, stadiumsSeen: stadiums.length, source: provider.source, errors: provider.errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown synchronization error";
    await prisma.syncRun.update({ where: { id: run.id }, data: { status: "failed", finishedAt: new Date(), message } });
    await logApp("error", "sync", "Provider synchronization failed", { provider: provider.name, message });
    await sendSyncFailureAlert({ provider: provider.name, message, syncRunId: run.id });
    return { provider: provider.name, status: "failed", message, teamsSeen: 0, matchesSeen: 0, groupsSeen: 0, stadiumsSeen: 0, source: provider.source, errors: provider.errors };
  }
}

function getProviderConfigurationMessage(provider: FootballProvider) {
  const maybeProvider = provider as FootballProvider & { configurationMessage?: () => string };
  return maybeProvider.configurationMessage?.() ?? "Provider is not configured.";
}

function normalizeFootballName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\b(usa|united states|united states of america)\b/g, "united states")
    .replace(/\b(czechia|czech republic)\b/g, "czech republic")
    .replace(/\b(bosnia and herzegovina|bosnia herzegovina)\b/g, "bosnia and herzegovina")
    .replace(/\b(congo dr|dr congo|democratic republic of the congo)\b/g, "dr congo")
    .replace(/\b(cote d ivoire|ivory coast)\b/g, "ivory coast")
    .replace(/\b(korea republic|south korea)\b/g, "south korea")
    .replace(/\b(ir iran|iran)\b/g, "iran")
    .trim();
}

export async function synchronizeAllProviders() {
  const providers: FootballProvider[] = [new WorldCup2026OpenSourceProvider(), new ApiFootballProvider(), new TheSportsDbProvider()];
  const results = [];
  for (const provider of providers) {
    results.push(await synchronizeProvider(provider));
  }
  return results;
}
