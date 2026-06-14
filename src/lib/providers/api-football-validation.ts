import { MatchStatus, ProviderName } from "@prisma/client";
import { z } from "zod";
import type { ProviderEvent, ProviderLineup, ProviderMatch, ProviderMatchStatistic, ProviderPlayer, ProviderSquad, ProviderTeam, ProviderTeamStatistic } from "@/lib/providers/types";

export const apiFootballTeamResponseSchema = z.object({
  response: z.array(z.object({
    team: z.object({
      id: z.number(),
      name: z.string(),
      country: z.string().nullable().optional(),
      code: z.string().nullable().optional(),
      logo: z.string().nullable().optional()
    })
  }))
});

export const apiFootballFixtureResponseSchema = z.object({
  response: z.array(z.object({
    fixture: z.object({
      id: z.number(),
      date: z.string(),
      venue: z.object({ name: z.string().nullable().optional(), city: z.string().nullable().optional() }).nullable().optional(),
      status: z.object({ short: z.string() })
    }),
    league: z.object({ round: z.string().nullable().optional() }),
    teams: z.object({
      home: z.object({ id: z.number(), name: z.string(), logo: z.string().nullable().optional() }),
      away: z.object({ id: z.number(), name: z.string(), logo: z.string().nullable().optional() })
    }),
    goals: z.object({ home: z.number().nullable(), away: z.number().nullable() }),
    score: z.object({
      extratime: z.object({ home: z.number().nullable(), away: z.number().nullable() }).nullable().optional(),
      penalty: z.object({ home: z.number().nullable(), away: z.number().nullable() }).nullable().optional()
    }).optional()
  }))
});

export const apiFootballSquadResponseSchema = z.object({
  response: z.array(z.object({
    team: z.object({ id: z.number(), name: z.string() }),
    players: z.array(z.object({
      id: z.number(),
      name: z.string(),
      age: z.number().nullable().optional(),
      number: z.number().nullable().optional(),
      position: z.string().nullable().optional(),
      photo: z.string().nullable().optional()
    }))
  }))
});

export const apiFootballPlayersResponseSchema = z.object({
  response: z.array(z.object({
    player: z.object({
      id: z.number(),
      name: z.string(),
      photo: z.string().nullable().optional(),
      age: z.number().nullable().optional(),
      height: z.string().nullable().optional(),
      injured: z.boolean().nullable().optional(),
      nationality: z.string().nullable().optional()
    }),
    statistics: z.array(z.object({
      team: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
      games: z.object({
        appearances: z.number().nullable().optional(),
        minutes: z.number().nullable().optional(),
        position: z.string().nullable().optional()
      }).nullable().optional(),
      goals: z.object({
        total: z.number().nullable().optional(),
        assists: z.number().nullable().optional()
      }).nullable().optional(),
      cards: z.object({
        yellow: z.number().nullable().optional(),
        red: z.number().nullable().optional()
      }).nullable().optional()
    })).optional()
  }))
});

export const apiFootballLineupResponseSchema = z.object({
  response: z.array(z.object({
    team: z.object({ id: z.number(), name: z.string() }),
    startXI: z.array(z.object({
      player: z.object({ id: z.number().nullable().optional(), name: z.string(), number: z.number().nullable().optional(), pos: z.string().nullable().optional() })
    })).optional(),
    substitutes: z.array(z.object({
      player: z.object({ id: z.number().nullable().optional(), name: z.string(), number: z.number().nullable().optional(), pos: z.string().nullable().optional() })
    })).optional()
  }))
});

export const apiFootballEventsResponseSchema = z.object({
  response: z.array(z.object({
    time: z.object({ elapsed: z.number().nullable().optional(), extra: z.number().nullable().optional() }),
    team: z.object({ id: z.number().nullable().optional(), name: z.string().nullable().optional() }),
    player: z.object({ id: z.number().nullable().optional(), name: z.string().nullable().optional() }).nullable().optional(),
    type: z.string(),
    detail: z.string().nullable().optional(),
    comments: z.string().nullable().optional()
  }))
});

export const apiFootballFixtureStatisticsResponseSchema = z.object({
  response: z.array(z.object({
    team: z.object({ id: z.number(), name: z.string() }),
    statistics: z.array(z.object({
      type: z.string(),
      value: z.union([z.string(), z.number(), z.null()]).optional()
    }))
  }))
});

export const apiFootballTeamStatisticsResponseSchema = z.object({
  response: z.object({
    fixtures: z.object({
      played: z.object({ total: z.number().nullable().optional() }).optional(),
      wins: z.object({ total: z.number().nullable().optional() }).optional(),
      draws: z.object({ total: z.number().nullable().optional() }).optional(),
      loses: z.object({ total: z.number().nullable().optional() }).optional()
    }).optional(),
    goals: z.object({
      for: z.object({ total: z.object({ total: z.number().nullable().optional() }).optional() }).optional(),
      against: z.object({ total: z.object({ total: z.number().nullable().optional() }).optional() }).optional()
    }).optional()
  })
});

export type ApiFootballTeamResponse = z.infer<typeof apiFootballTeamResponseSchema>;
export type ApiFootballFixtureResponse = z.infer<typeof apiFootballFixtureResponseSchema>;
export type ApiFootballSquadResponse = z.infer<typeof apiFootballSquadResponseSchema>;
export type ApiFootballPlayersResponse = z.infer<typeof apiFootballPlayersResponseSchema>;
export type ApiFootballLineupResponse = z.infer<typeof apiFootballLineupResponseSchema>;
export type ApiFootballEventsResponse = z.infer<typeof apiFootballEventsResponseSchema>;
export type ApiFootballFixtureStatisticsResponse = z.infer<typeof apiFootballFixtureStatisticsResponseSchema>;
export type ApiFootballTeamStatisticsResponse = z.infer<typeof apiFootballTeamStatisticsResponseSchema>;

export function mapApiFootballStatus(short: string): MatchStatus {
  if (["FT", "AET", "PEN"].includes(short)) return MatchStatus.FINISHED;
  if (["1H", "2H", "ET", "BT", "P"].includes(short)) return MatchStatus.LIVE;
  if (["PST", "TBD"].includes(short)) return MatchStatus.POSTPONED;
  if (["CANC", "ABD"].includes(short)) return MatchStatus.CANCELLED;
  return MatchStatus.SCHEDULED;
}

export function mapApiFootballTeam(team: ApiFootballTeamResponse["response"][number]["team"]): ProviderTeam {
  return {
    provider: ProviderName.API_FOOTBALL,
    providerId: String(team.id),
    name: team.name,
    country: team.country || team.name,
    fifaCode: team.code || undefined,
    badgeUrl: team.logo || undefined
  };
}

export function mapApiFootballFixture(item: ApiFootballFixtureResponse["response"][number]): ProviderMatch {
  return {
    provider: ProviderName.API_FOOTBALL,
    providerId: String(item.fixture.id),
    matchNumber: item.fixture.id,
    stage: item.league.round || "World Cup",
    stageOrder: item.league.round?.includes("Group") ? 1 : 2,
    groupName: item.league.round?.match(/Group [A-L]/)?.[0],
    kickoffAt: new Date(item.fixture.date),
    venue: item.fixture.venue?.name || undefined,
    city: item.fixture.venue?.city || undefined,
    status: mapApiFootballStatus(item.fixture.status.short),
    homeTeam: {
      provider: ProviderName.API_FOOTBALL,
      providerId: String(item.teams.home.id),
      name: item.teams.home.name,
      country: item.teams.home.name,
      badgeUrl: item.teams.home.logo || undefined
    },
    awayTeam: {
      provider: ProviderName.API_FOOTBALL,
      providerId: String(item.teams.away.id),
      name: item.teams.away.name,
      country: item.teams.away.name,
      badgeUrl: item.teams.away.logo || undefined
    },
    homeScore: item.goals.home ?? undefined,
    awayScore: item.goals.away ?? undefined,
    extraTimeHome: item.score?.extratime?.home ?? undefined,
    extraTimeAway: item.score?.extratime?.away ?? undefined,
    penaltyHome: item.score?.penalty?.home ?? undefined,
    penaltyAway: item.score?.penalty?.away ?? undefined
  };
}

export function mapApiFootballSquad(item: ApiFootballSquadResponse["response"][number]): ProviderSquad {
  return {
    provider: ProviderName.API_FOOTBALL,
    teamProviderId: String(item.team.id),
    players: item.players.map((player) => ({
      provider: ProviderName.API_FOOTBALL,
      providerId: String(player.id),
      name: player.name,
      photoUrl: player.photo || undefined,
      age: player.age ?? undefined,
      shirtNumber: player.number ?? undefined,
      position: player.position ?? undefined,
      teamProviderId: String(item.team.id),
      raw: player
    }))
  };
}

export function mapApiFootballPlayer(item: ApiFootballPlayersResponse["response"][number]): ProviderPlayer {
  const statistic = item.statistics?.[0];
  return {
    provider: ProviderName.API_FOOTBALL,
    providerId: String(item.player.id),
    name: item.player.name,
    photoUrl: item.player.photo || undefined,
    age: item.player.age ?? undefined,
    height: item.player.height ?? undefined,
    nationality: item.player.nationality ?? undefined,
    position: statistic?.games?.position ?? undefined,
    teamProviderId: statistic?.team?.id ? String(statistic.team.id) : undefined,
    appearances: statistic?.games?.appearances ?? undefined,
    minutes: statistic?.games?.minutes ?? undefined,
    goals: statistic?.goals?.total ?? undefined,
    assists: statistic?.goals?.assists ?? undefined,
    yellowCards: statistic?.cards?.yellow ?? undefined,
    redCards: statistic?.cards?.red ?? undefined,
    raw: item
  };
}

export function mapApiFootballLineups(matchProviderId: string, data: ApiFootballLineupResponse): ProviderLineup[] {
  return data.response.flatMap((lineup) => [
    ...(lineup.startXI ?? []).map(({ player }) => ({
      matchProviderId,
      teamProviderId: String(lineup.team.id),
      playerProviderId: player.id ? String(player.id) : undefined,
      playerName: player.name,
      role: "STARTER",
      position: player.pos ?? undefined,
      shirtNumber: player.number ?? undefined,
      raw: player
    })),
    ...(lineup.substitutes ?? []).map(({ player }) => ({
      matchProviderId,
      teamProviderId: String(lineup.team.id),
      playerProviderId: player.id ? String(player.id) : undefined,
      playerName: player.name,
      role: "SUBSTITUTE",
      position: player.pos ?? undefined,
      shirtNumber: player.number ?? undefined,
      raw: player
    }))
  ]);
}

export function mapApiFootballEvents(matchProviderId: string, data: ApiFootballEventsResponse): ProviderEvent[] {
  return data.response.map((event, index) => ({
    matchProviderId,
    providerEventId: `${matchProviderId}:${index}:${event.time.elapsed ?? ""}:${event.type}:${event.detail ?? ""}`,
    teamProviderId: event.team.id ? String(event.team.id) : undefined,
    playerProviderId: event.player?.id ? String(event.player.id) : undefined,
    playerName: event.player?.name ?? undefined,
    minute: event.time.elapsed ?? undefined,
    extraMinute: event.time.extra ?? undefined,
    type: event.type,
    detail: event.detail ?? undefined,
    comments: event.comments ?? undefined,
    raw: event
  }));
}

export function mapApiFootballFixtureStatistics(matchProviderId: string, data: ApiFootballFixtureStatisticsResponse): ProviderMatchStatistic[] {
  return data.response.flatMap((team) =>
    team.statistics.map((statistic) => ({
      matchProviderId,
      teamProviderId: String(team.team.id),
      type: statistic.type,
      value: statistic.value == null ? undefined : String(statistic.value),
      raw: statistic
    }))
  );
}

export function mapApiFootballTeamStatistics(teamProviderId: string, data: ApiFootballTeamStatisticsResponse): ProviderTeamStatistic {
  const response = data.response;
  return {
    teamProviderId,
    played: response.fixtures?.played?.total ?? undefined,
    won: response.fixtures?.wins?.total ?? undefined,
    drawn: response.fixtures?.draws?.total ?? undefined,
    lost: response.fixtures?.loses?.total ?? undefined,
    goalsFor: response.goals?.for?.total?.total ?? undefined,
    goalsAgainst: response.goals?.against?.total?.total ?? undefined,
    raw: response
  };
}
