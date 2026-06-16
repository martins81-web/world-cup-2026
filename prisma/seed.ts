import { Prisma, PrismaClient } from "@prisma/client";
import { loadLocalWorldCup2026Dataset } from "../src/lib/providers/worldcup2026";
import type { ProviderTeam } from "../src/lib/providers/types";

const prisma = new PrismaClient();

const groupNames = Array.from({ length: 12 }, (_, index) => `Group ${String.fromCharCode(65 + index)}`);
const cities = ["Toronto", "Vancouver", "Mexico City", "Guadalajara", "Monterrey", "New York New Jersey", "Dallas", "Kansas City", "Houston", "Atlanta", "Los Angeles", "Miami"];

type SeedMatch = Prisma.MatchUncheckedCreateInput & { tournamentId: string; matchNumber: number };

async function upsertMatch(data: SeedMatch) {
  return prisma.match.upsert({
    where: { tournamentId_matchNumber: { tournamentId: data.tournamentId, matchNumber: data.matchNumber } },
    update: data,
    create: data
  });
}

async function upsertSeedTeam(item: ProviderTeam) {
  const existing = await prisma.team.findFirst({
    where: { OR: [{ worldcup2026Id: item.providerId }, ...(item.fifaCode ? [{ fifaCode: item.fifaCode }] : []), { name: item.name }] }
  });

  if (existing) {
    return prisma.team.update({
      where: { id: existing.id },
      data: {
        name: item.name,
        country: item.country,
        fifaCode: item.fifaCode,
        badgeUrl: item.badgeUrl,
        worldcup2026Id: item.providerId
      }
    });
  }

  return prisma.team.create({
    data: {
      name: item.name,
      country: item.country,
      fifaCode: item.fifaCode,
      badgeUrl: item.badgeUrl,
      worldcup2026Id: item.providerId
    }
  });
}

async function removeDevelopmentTeams(tournamentId: string) {
  const developmentTeams = await prisma.team.findMany({
    where: { name: { startsWith: "Development " } },
    select: { id: true }
  });
  const teamIds = developmentTeams.map((team) => team.id);
  if (teamIds.length === 0) return;

  await prisma.squadMembership.deleteMany({ where: { tournamentId, teamId: { in: teamIds } } });
  await prisma.groupTeam.deleteMany({ where: { teamId: { in: teamIds } } });
  await prisma.teamTournament.deleteMany({ where: { tournamentId, teamId: { in: teamIds } } });
  await prisma.player.deleteMany({ where: { name: { startsWith: "Development Player " } } });
  await prisma.team.deleteMany({
    where: {
      id: { in: teamIds },
      apiFootballId: null,
      sportsDbId: null
    }
  });
}

async function main() {
  const dataset = loadLocalWorldCup2026Dataset();
  const tournament = await prisma.tournament.upsert({
    where: { slug: "world-cup-2026" },
    update: { isSeedData: true },
    create: {
      slug: "world-cup-2026",
      name: "FIFA World Cup 2026",
      season: 2026,
      startsAt: new Date("2026-06-11T00:00:00Z"),
      endsAt: new Date("2026-07-19T23:59:59Z"),
      isSeedData: true
    }
  });

  const teamByProviderId = new Map<string, { id: string; name: string; fifaCode: string | null }>();
  for (const item of dataset.teams) {
    const team = await upsertSeedTeam(item);
    teamByProviderId.set(item.providerId, team);

    await prisma.teamTournament.upsert({
      where: { teamId_tournamentId: { teamId: team.id, tournamentId: tournament.id } },
      update: {},
      create: { teamId: team.id, tournamentId: tournament.id }
    });
  }

  for (const groupItem of dataset.groups) {
    const group = await prisma.group.upsert({
      where: { tournamentId_name: { tournamentId: tournament.id, name: groupItem.name } },
      update: {},
      create: { tournamentId: tournament.id, name: groupItem.name }
    });

    for (const providerId of groupItem.teamProviderIds) {
      const team = teamByProviderId.get(providerId);
      if (!team) continue;
      await prisma.groupTeam.upsert({
        where: { groupId_teamId: { groupId: group.id, teamId: team.id } },
        update: {},
        create: { groupId: group.id, teamId: team.id }
      });
    }
  }

  for (const stadium of dataset.stadiums) {
    await prisma.stadium.upsert({
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

  for (const [index, team] of [...teamByProviderId.values()].slice(0, 8).entries()) {
    for (let playerIndex = 1; playerIndex <= 2; playerIndex += 1) {
      const player = await prisma.player.upsert({
        where: { apiFootballId: 900000 + index * 10 + playerIndex },
        update: {
          name: `${team.name} Seed Player ${playerIndex}`,
          position: playerIndex === 1 ? "Goalkeeper" : "Forward"
        },
        create: {
          apiFootballId: 900000 + index * 10 + playerIndex,
          name: `${team.name} Seed Player ${playerIndex}`,
          position: playerIndex === 1 ? "Goalkeeper" : "Forward",
          nationality: team.name
        }
      });

      await prisma.squadMembership.upsert({
        where: { tournamentId_teamId_playerId: { tournamentId: tournament.id, teamId: team.id, playerId: player.id } },
        update: { shirtNumber: playerIndex, position: player.position },
        create: { tournamentId: tournament.id, teamId: team.id, playerId: player.id, shirtNumber: playerIndex, position: player.position }
      });
    }
  }

  await removeDevelopmentTeams(tournament.id);

  for (const match of dataset.matches) {
    const homeTeam = match.homeTeam ? teamByProviderId.get(match.homeTeam.providerId) : null;
    const awayTeam = match.awayTeam ? teamByProviderId.get(match.awayTeam.providerId) : null;
    const stadium = match.stadiumProviderId ? await prisma.stadium.findUnique({ where: { worldcup2026Id: match.stadiumProviderId } }) : null;
    await upsertMatch({
      tournamentId: tournament.id,
      sourceProvider: "WORLDCUP2026_OPEN_SOURCE",
      providerId: match.providerId,
      matchNumber: match.matchNumber ?? Number(match.providerId),
      stage: match.stage,
      stageOrder: match.stageOrder ?? 0,
      knockoutRound: match.knockoutRound,
      groupName: match.groupName,
      kickoffAt: match.kickoffAt,
      venue: stadium?.fifaName ?? stadium?.name,
      city: stadium?.city ?? cities[(Number(match.matchNumber ?? 1) - 1) % cities.length],
      stadiumId: stadium?.id,
      status: match.status,
      homeTeamId: homeTeam?.id,
      awayTeamId: awayTeam?.id,
      homeSeed: match.homeSeed,
      awaySeed: match.awaySeed,
      homeScore: match.homeScore,
      awayScore: match.awayScore
    });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
