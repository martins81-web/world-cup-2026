import { MatchStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { applyKnockoutProgression, calculateGroupTables, rankThirdPlaceTeams } from "@/lib/tournament/engine";
import { sortMatchesByNumberAndChronology } from "@/lib/tournament/sorting";

export type MatchFilters = {
  team?: string;
  group?: string;
  stage?: string;
  date?: string;
  status?: string;
};

export const matchInclude = {
  homeTeam: true,
  awayTeam: true,
  stadium: true,
  winnerToMatch: true,
  loserToMatch: true,
  lineups: { include: { team: true, player: true } },
  events: { include: { team: true, player: true }, orderBy: [{ minute: "asc" }] },
  statistics: { include: { team: true }, orderBy: [{ team: { name: "asc" } }, { type: "asc" }] }
} satisfies Prisma.MatchInclude;

export async function getTournament() {
  return prisma.tournament.findUnique({ where: { slug: "world-cup-2026" } });
}

export async function getMatches(filters: MatchFilters = {}) {
  const where: Prisma.MatchWhereInput = {
    tournament: { slug: "world-cup-2026" }
  };

  if (filters.team) {
    where.OR = [
      { homeTeam: { name: { contains: filters.team, mode: "insensitive" } } },
      { awayTeam: { name: { contains: filters.team, mode: "insensitive" } } }
    ];
  }
  if (filters.group) where.groupName = filters.group;
  if (filters.stage) where.stage = filters.stage;
  if (filters.status && filters.status in MatchStatus) where.status = filters.status as MatchStatus;
  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00.000Z`);
    const end = new Date(`${filters.date}T23:59:59.999Z`);
    where.kickoffAt = { gte: start, lte: end };
  }

  const matches = await prisma.match.findMany({
    where,
    include: matchInclude,
    orderBy: [{ matchNumber: "asc" }, { kickoffAt: "asc" }]
  });
  return sortMatchesByNumberAndChronology(matches);
}

export async function getMatchById(id: string) {
  const where = /^\d+$/.test(id)
    ? { tournament: { slug: "world-cup-2026" }, matchNumber: Number(id) }
    : { tournament: { slug: "world-cup-2026" }, id };

  return prisma.match.findFirst({ where, include: matchInclude });
}

export async function getGroupsWithTables() {
  const tournament = await prisma.tournament.findUnique({
    where: { slug: "world-cup-2026" },
    include: {
      groups: {
        include: { teams: { include: { team: true } } },
        orderBy: { name: "asc" }
      },
      matches: { include: { homeTeam: true, awayTeam: true }, orderBy: [{ matchNumber: "asc" }, { kickoffAt: "asc" }] }
    }
  });

  return {
    tournament,
    tables: tournament ? calculateGroupTables(tournament.groups, tournament.matches) : []
  };
}

export async function getThirdPlaceRanking() {
  const { tournament, tables } = await getGroupsWithTables();
  return { tournament, ranking: rankThirdPlaceTeams(tables) };
}

export async function getBracket() {
  const tournament = await getTournament();
  const matches = await prisma.match.findMany({
    where: { tournament: { slug: "world-cup-2026" }, knockoutRound: { not: null } },
    include: matchInclude,
    orderBy: [{ stageOrder: "asc" }, { matchNumber: "asc" }, { kickoffAt: "asc" }]
  });

  return {
    tournament,
    rounds: groupBy(matches, (match) => match.stage),
    matches: applyKnockoutProgression(matches)
  };
}

export async function getTeams() {
  const tournament = await getTournament();
  const teams = await prisma.team.findMany({
    where: { tournaments: { some: { tournament: { slug: "world-cup-2026" } } } },
    include: { groupEntries: { include: { group: true }, where: { group: { tournament: { slug: "world-cup-2026" } } } } },
    orderBy: { name: "asc" }
  });
  return { tournament, teams };
}

export async function getTeamById(id: string) {
  const tournament = await getTournament();
  const team = await prisma.team.findFirst({
    where: {
      OR: [{ id }, ...(Number.isFinite(Number(id)) ? [{ apiFootballId: Number(id) }] : [])],
      tournaments: { some: { tournament: { slug: "world-cup-2026" } } }
    },
    include: {
      groupEntries: { include: { group: true }, where: { group: { tournament: { slug: "world-cup-2026" } } } },
      statistics: { where: { tournament: { slug: "world-cup-2026" } } }
    }
  });
  return { tournament, team };
}

export async function getTeamSquad(id: string) {
  const { tournament, team } = await getTeamById(id);
  const squad = team ? await prisma.squadMembership.findMany({
    where: { teamId: team.id, tournament: { slug: "world-cup-2026" } },
    include: { player: { include: { statistics: { where: { tournament: { slug: "world-cup-2026" } } } } } },
    orderBy: [{ position: "asc" }, { shirtNumber: "asc" }]
  }) : [];
  return { tournament, team, squad };
}

export async function getPlayerById(id: string) {
  const tournament = await getTournament();
  const player = await prisma.player.findFirst({
    where: { OR: [{ id }, ...(Number.isFinite(Number(id)) ? [{ apiFootballId: Number(id) }] : [])] },
    include: {
      squads: { include: { team: true, tournament: true }, where: { tournament: { slug: "world-cup-2026" } } },
      statistics: { include: { team: true }, where: { tournament: { slug: "world-cup-2026" } } },
      events: { include: { match: true, team: true }, orderBy: [{ match: { kickoffAt: "asc" } }] }
    }
  });
  return { tournament, player };
}

export async function getStatistics() {
  const tournament = await getTournament();
  const [teamStatistics, playerStatistics] = await Promise.all([
    prisma.teamStatistic.findMany({
      where: { tournament: { slug: "world-cup-2026" } },
      include: { team: true },
      orderBy: [{ goalsFor: "desc" }]
    }),
    prisma.playerStatistic.findMany({
      where: { tournament: { slug: "world-cup-2026" } },
      include: { player: true, team: true },
      orderBy: [{ goals: "desc" }, { assists: "desc" }]
    })
  ]);
  return { tournament, teamStatistics, playerStatistics };
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = getKey(item);
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});
}
