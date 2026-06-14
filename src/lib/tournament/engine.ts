import type { Group, GroupTeam, Match, Team } from "@prisma/client";

type GroupWithTeams = Group & { teams: Array<GroupTeam & { team: Team }> };
type MatchWithTeams = Match & { homeTeam?: Team | null; awayTeam?: Team | null };

export type GroupTableRow = {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type GroupTable = {
  groupName: string;
  rows: GroupTableRow[];
};

export function calculateGroupTables(groups: GroupWithTeams[], matches: MatchWithTeams[]): GroupTable[] {
  return groups.map((group) => {
    const rows = new Map<string, GroupTableRow>();
    for (const entry of group.teams) {
      rows.set(entry.teamId, {
        teamId: entry.teamId,
        teamName: entry.team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      });
    }

    for (const match of matches) {
      if (match.groupName !== group.name || match.status !== "FINISHED") continue;
      if (!match.homeTeamId || !match.awayTeamId || match.homeScore == null || match.awayScore == null) continue;
      const home = rows.get(match.homeTeamId);
      const away = rows.get(match.awayTeamId);
      if (!home || !away) continue;

      home.played += 1;
      away.played += 1;
      home.goalsFor += match.homeScore;
      home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore;
      away.goalsAgainst += match.homeScore;

      if (match.homeScore > match.awayScore) {
        home.won += 1;
        away.lost += 1;
        home.points += 3;
      } else if (match.homeScore < match.awayScore) {
        away.won += 1;
        home.lost += 1;
        away.points += 3;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    }

    return {
      groupName: group.name,
      rows: [...rows.values()].sort((a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.teamName.localeCompare(b.teamName)
      )
    };
  });
}

export function calculateKnockoutWinner(match: Pick<Match, "homeTeamId" | "awayTeamId" | "homeScore" | "awayScore" | "penaltyHome" | "penaltyAway">) {
  if (!match.homeTeamId || !match.awayTeamId || match.homeScore == null || match.awayScore == null) return null;
  if (match.homeScore > match.awayScore) return match.homeTeamId;
  if (match.awayScore > match.homeScore) return match.awayTeamId;
  if (match.penaltyHome == null || match.penaltyAway == null) return null;
  if (match.penaltyHome > match.penaltyAway) return match.homeTeamId;
  if (match.penaltyAway > match.penaltyHome) return match.awayTeamId;
  return null;
}

export function rankThirdPlaceTeams(tables: GroupTable[]) {
  return tables
    .map((table) => table.rows[2])
    .filter((row): row is GroupTableRow => Boolean(row))
    .sort((a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.teamName.localeCompare(b.teamName)
    )
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      qualified: index < 8,
      qualificationStatus: index < 8 ? "PROVISIONAL" : "PENDING"
    }));
}

export function applyKnockoutProgression<T extends MatchWithTeams>(matches: T[]) {
  const winnerByMatch = new Map<string, string | null>();
  for (const match of matches) {
    winnerByMatch.set(match.id, calculateKnockoutWinner(match));
  }

  return matches.map((match) => {
    const incoming = matches
      .filter((source) => source.winnerToMatchId === match.id || source.loserToMatchId === match.id)
      .map((source) => ({
        sourceMatchId: source.id,
        sourceMatchNumber: source.matchNumber,
        slot: source.winnerToMatchId === match.id ? source.winnerToSlot : source.loserToSlot,
        teamId: source.winnerToMatchId === match.id ? winnerByMatch.get(source.id) : loserFromMatch(source)
      }));

    return { ...match, incoming };
  });
}

function loserFromMatch(match: Pick<Match, "homeTeamId" | "awayTeamId" | "homeScore" | "awayScore" | "penaltyHome" | "penaltyAway">) {
  const winner = calculateKnockoutWinner(match);
  if (!winner || !match.homeTeamId || !match.awayTeamId) return null;
  return winner === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
}
