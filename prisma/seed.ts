import { MatchStatus, Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const groupNames = Array.from({ length: 12 }, (_, index) => `Group ${String.fromCharCode(65 + index)}`);
const cities = ["Toronto", "Vancouver", "Mexico City", "Guadalajara", "Monterrey", "New York New Jersey", "Dallas", "Kansas City", "Houston", "Atlanta", "Los Angeles", "Miami"];

function developmentTeams() {
  return groupNames.flatMap((groupName) =>
    Array.from({ length: 4 }, (_, teamIndex) => ({
      name: `Development ${groupName.replace("Group ", "")}${teamIndex + 1}`,
      country: `Development ${groupName.replace("Group ", "")}${teamIndex + 1}`,
      groupName
    }))
  );
}

type SeedMatch = Prisma.MatchUncheckedCreateInput & { tournamentId: string; matchNumber: number };

async function upsertMatch(data: SeedMatch) {
  return prisma.match.upsert({
    where: { tournamentId_matchNumber: { tournamentId: data.tournamentId, matchNumber: data.matchNumber } },
    update: data,
    create: data
  });
}

async function main() {
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

  const teamByName = new Map<string, { id: string; name: string }>();
  for (const item of developmentTeams()) {
    const team = await prisma.team.upsert({
      where: { name: item.name },
      update: { country: item.country },
      create: { name: item.name, country: item.country }
    });
    teamByName.set(item.name, team);

    const group = await prisma.group.upsert({
      where: { tournamentId_name: { tournamentId: tournament.id, name: item.groupName } },
      update: {},
      create: { tournamentId: tournament.id, name: item.groupName }
    });

    await prisma.teamTournament.upsert({
      where: { teamId_tournamentId: { teamId: team.id, tournamentId: tournament.id } },
      update: {},
      create: { teamId: team.id, tournamentId: tournament.id }
    });
    await prisma.groupTeam.upsert({
      where: { groupId_teamId: { groupId: group.id, teamId: team.id } },
      update: {},
      create: { groupId: group.id, teamId: team.id }
    });
  }

  for (const [index, team] of [...teamByName.values()].slice(0, 8).entries()) {
    for (let playerIndex = 1; playerIndex <= 2; playerIndex += 1) {
      const player = await prisma.player.upsert({
        where: { apiFootballId: 900000 + index * 10 + playerIndex },
        update: {
          name: `Development Player ${index + 1}-${playerIndex}`,
          position: playerIndex === 1 ? "Goalkeeper" : "Forward"
        },
        create: {
          apiFootballId: 900000 + index * 10 + playerIndex,
          name: `Development Player ${index + 1}-${playerIndex}`,
          position: playerIndex === 1 ? "Goalkeeper" : "Forward",
          nationality: team.name.replace("Development ", "")
        }
      });

      await prisma.squadMembership.upsert({
        where: { tournamentId_teamId_playerId: { tournamentId: tournament.id, teamId: team.id, playerId: player.id } },
        update: { shirtNumber: playerIndex, position: player.position },
        create: { tournamentId: tournament.id, teamId: team.id, playerId: player.id, shirtNumber: playerIndex, position: player.position }
      });
    }
  }

  let matchNumber = 1;
  for (const groupName of groupNames) {
    const letter = groupName.replace("Group ", "");
    const teams = [1, 2, 3, 4].map((number) => teamByName.get(`Development ${letter}${number}`)!);
    const pairings = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];
    for (const [homeIndex, awayIndex] of pairings) {
      await upsertMatch({
        tournamentId: tournament.id,
        sourceProvider: "API_FOOTBALL",
        providerId: `development-seed-${matchNumber}`,
        matchNumber,
        stage: "Group Stage",
        stageOrder: 1,
        groupName,
        kickoffAt: new Date(Date.UTC(2026, 5, 10 + matchNumber, 18 + (matchNumber % 5), 0, 0)),
        venue: "Development Seed Venue",
        city: cities[(matchNumber - 1) % cities.length],
        status: matchNumber % 6 === 1 ? MatchStatus.FINISHED : MatchStatus.SCHEDULED,
        homeTeamId: teams[homeIndex].id,
        awayTeamId: teams[awayIndex].id,
        homeScore: matchNumber % 6 === 1 ? 1 : null,
        awayScore: matchNumber % 6 === 1 ? 1 : null
      });
      matchNumber += 1;
    }
  }

  const knockoutPlan = [
    { stage: "Round of 32", round: "R32", count: 16, order: 2 },
    { stage: "Round of 16", round: "R16", count: 8, order: 3 },
    { stage: "Quarter-finals", round: "QF", count: 4, order: 4 },
    { stage: "Semi-finals", round: "SF", count: 2, order: 5 },
    { stage: "Third-place play-off", round: "3P", count: 1, order: 6 },
    { stage: "Final", round: "F", count: 1, order: 7 }
  ];

  const createdByRound = new Map<string, Awaited<ReturnType<typeof upsertMatch>>[]>();
  for (const plan of knockoutPlan) {
    const matches = [];
    for (let index = 0; index < plan.count; index += 1) {
      matches.push(await upsertMatch({
        tournamentId: tournament.id,
        sourceProvider: "API_FOOTBALL",
        providerId: `development-seed-${matchNumber}`,
        matchNumber,
        stage: plan.stage,
        stageOrder: plan.order,
        knockoutRound: plan.round,
        kickoffAt: new Date(Date.UTC(2026, 6, 1 + plan.order * 2 + index, 20, 0, 0)),
        venue: "Development Seed Knockout Venue",
        city: cities[(matchNumber - 1) % cities.length],
        status: MatchStatus.SCHEDULED,
        homeSeed: `${plan.round} home ${index + 1}`,
        awaySeed: `${plan.round} away ${index + 1}`
      }));
      matchNumber += 1;
    }
    createdByRound.set(plan.round, matches);
  }

  const linkWinners = async (fromRound: string, toRound: string) => {
    const from = createdByRound.get(fromRound) ?? [];
    const to = createdByRound.get(toRound) ?? [];
    for (let index = 0; index < from.length; index += 1) {
      await prisma.match.update({
        where: { id: from[index].id },
        data: {
          winnerToMatchId: to[Math.floor(index / 2)]?.id,
          winnerToSlot: index % 2 === 0 ? "HOME" : "AWAY"
        }
      });
    }
  };

  await linkWinners("R32", "R16");
  await linkWinners("R16", "QF");
  await linkWinners("QF", "SF");

  const semis = createdByRound.get("SF") ?? [];
  const third = createdByRound.get("3P")?.[0];
  const final = createdByRound.get("F")?.[0];
  for (let index = 0; index < semis.length; index += 1) {
    await prisma.match.update({
      where: { id: semis[index].id },
      data: {
        winnerToMatchId: final?.id,
        winnerToSlot: index === 0 ? "HOME" : "AWAY",
        loserToMatchId: third?.id,
        loserToSlot: index === 0 ? "HOME" : "AWAY"
      }
    });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
