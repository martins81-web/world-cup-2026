import { describe, expect, it } from "vitest";
import { applyKnockoutProgression, calculateGroupTables, calculateKnockoutWinner, rankThirdPlaceTeams } from "@/lib/tournament/engine";
import { sortMatchesByNumberAndChronology, sortMatchesChronologically } from "@/lib/tournament/sorting";

describe("tournament engine", () => {
  it("sorts group rows by points, goal difference, goals for, then name", () => {
    const groups = [{
      id: "g1",
      name: "Group A",
      tournamentId: "t1",
      teams: [
        { id: "gt1", groupId: "g1", teamId: "a", team: { id: "a", name: "Alpha", country: "Alpha", fifaCode: null, badgeUrl: null, apiFootballId: null, sportsDbId: null, createdAt: new Date(), updatedAt: new Date() } },
        { id: "gt2", groupId: "g1", teamId: "b", team: { id: "b", name: "Beta", country: "Beta", fifaCode: null, badgeUrl: null, apiFootballId: null, sportsDbId: null, createdAt: new Date(), updatedAt: new Date() } }
      ]
    }];

    const tables = calculateGroupTables(groups as any, [{
      id: "m1",
      tournamentId: "t1",
      providerId: "1",
      stage: "Group Stage",
      groupName: "Group A",
      kickoffAt: new Date(),
      venue: null,
      city: null,
      status: "FINISHED",
      homeTeamId: "a",
      awayTeamId: "b",
      homeScore: 2,
      awayScore: 0,
      penaltyHome: null,
      penaltyAway: null,
      sourceProvider: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }] as any);

    expect(tables[0].rows[0]).toMatchObject({ teamId: "a", points: 3, goalDifference: 2 });
    expect(tables[0].rows[1]).toMatchObject({ teamId: "b", points: 0, goalDifference: -2 });
  });

  it("uses penalties to resolve knockout ties", () => {
    expect(calculateKnockoutWinner({
      homeTeamId: "a",
      awayTeamId: "b",
      homeScore: 1,
      awayScore: 1,
      penaltyHome: 4,
      penaltyAway: 5
    })).toBe("b");
  });

  it("ranks third-place teams and marks the top eight as qualified", () => {
    const tables = Array.from({ length: 12 }, (_, index) => ({
      groupName: `Group ${index}`,
      rows: [
        row(`w${index}`, `Winner ${index}`, 9),
        row(`r${index}`, `Runner ${index}`, 6),
        row(`t${index}`, `Third ${index}`, 12 - index)
      ]
    }));

    const ranking = rankThirdPlaceTeams(tables);

    expect(ranking).toHaveLength(12);
    expect(ranking[0]).toMatchObject({ teamName: "Third 0", rank: 1, qualified: true });
    expect(ranking[7]).toMatchObject({ rank: 8, qualified: true });
    expect(ranking[8]).toMatchObject({ rank: 9, qualified: false });
  });

  it("exposes knockout winner progression into target match slots", () => {
    const source = {
      id: "source",
      matchNumber: 1,
      winnerToMatchId: "target",
      winnerToSlot: "HOME",
      loserToMatchId: null,
      loserToSlot: null,
      homeTeamId: "a",
      awayTeamId: "b",
      homeScore: 2,
      awayScore: 1,
      penaltyHome: null,
      penaltyAway: null
    };
    const target = {
      id: "target",
      matchNumber: 2,
      winnerToMatchId: null,
      winnerToSlot: null,
      loserToMatchId: null,
      loserToSlot: null,
      homeTeamId: null,
      awayTeamId: null,
      homeScore: null,
      awayScore: null,
      penaltyHome: null,
      penaltyAway: null
    };

    const progressed = applyKnockoutProgression([source, target] as any);

    expect(progressed.find((match) => match.id === "target")?.incoming).toContainEqual({
      sourceMatchId: "source",
      sourceMatchNumber: 1,
      slot: "HOME",
      teamId: "a"
    });
  });

  it("sorts by match number without assuming row order", () => {
    const sorted = sortMatchesByNumberAndChronology([
      { matchNumber: 3, kickoffAt: new Date("2026-06-11T10:00:00Z") },
      { matchNumber: 1, kickoffAt: new Date("2026-06-12T10:00:00Z") },
      { matchNumber: 2, kickoffAt: new Date("2026-06-10T10:00:00Z") }
    ]);

    expect(sorted.map((match) => match.matchNumber)).toEqual([1, 2, 3]);
  });

  it("sorts chronologically with match number as a tie breaker", () => {
    const sorted = sortMatchesChronologically([
      { matchNumber: 3, kickoffAt: new Date("2026-06-11T10:00:00Z") },
      { matchNumber: 1, kickoffAt: new Date("2026-06-10T10:00:00Z") },
      { matchNumber: 2, kickoffAt: new Date("2026-06-10T10:00:00Z") }
    ]);

    expect(sorted.map((match) => match.matchNumber)).toEqual([1, 2, 3]);
  });
});

function row(teamId: string, teamName: string, points: number) {
  return {
    teamId,
    teamName,
    played: 3,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: points,
    goalsAgainst: 0,
    goalDifference: points,
    points
  };
}
