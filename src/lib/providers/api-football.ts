import { ProviderName } from "@prisma/client";
import { env } from "@/lib/env";
import { cachedJsonFetch } from "@/lib/providers/http-cache";
import type { FootballProvider, ProviderEvent, ProviderLineup, ProviderMatch, ProviderMatchStatistic, ProviderPlayer, ProviderSquad, ProviderTeam, ProviderTeamStatistic } from "@/lib/providers/types";
import { logApp } from "@/lib/logger";
import {
  apiFootballEventsResponseSchema,
  apiFootballFixtureResponseSchema,
  apiFootballFixtureStatisticsResponseSchema,
  apiFootballLineupResponseSchema,
  apiFootballPlayersResponseSchema,
  apiFootballSquadResponseSchema,
  apiFootballTeamResponseSchema,
  apiFootballTeamStatisticsResponseSchema,
  mapApiFootballEvents,
  mapApiFootballFixture,
  mapApiFootballFixtureStatistics,
  mapApiFootballLineups,
  mapApiFootballPlayer,
  mapApiFootballSquad,
  mapApiFootballTeam,
  mapApiFootballTeamStatistics,
  type ApiFootballFixtureResponse,
  type ApiFootballTeamResponse
} from "@/lib/providers/api-football-validation";

const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;

function assertNoApiFootballErrors(data: unknown) {
  if (!data || typeof data !== "object" || !("errors" in data)) return;

  const errors = (data as { errors?: unknown }).errors;
  const hasErrors = Array.isArray(errors)
    ? errors.length > 0
    : Boolean(errors && typeof errors === "object" && Object.keys(errors).length > 0);

  if (hasErrors) {
    throw new Error(`API_FOOTBALL provider returned errors: ${JSON.stringify(errors)}`);
  }
}

export class ApiFootballProvider implements FootballProvider {
  readonly name = ProviderName.API_FOOTBALL;
  private readonly includeDetails: boolean;

  constructor(options: { includeDetails?: boolean } = {}) {
    this.includeDetails = options.includeDetails ?? true;
  }

  isConfigured() {
    return env.API_FOOTBALL_KEY.length > 0;
  }

  async getWorldCupTeams(): Promise<ProviderTeam[]> {
    if (!this.isConfigured()) return [];
    const url = `${env.API_FOOTBALL_BASE_URL}/teams?league=${WORLD_CUP_LEAGUE_ID}&season=${WORLD_CUP_SEASON}`;
    const data = await cachedJsonFetch<ApiFootballTeamResponse>({
      provider: this.name,
      cacheKey: `teams:${WORLD_CUP_SEASON}`,
      url,
      headers: { "x-apisports-key": env.API_FOOTBALL_KEY },
      quotaLimit: env.API_FOOTBALL_DAILY_LIMIT
    });
    assertNoApiFootballErrors(data);

    const parsed = apiFootballTeamResponseSchema.safeParse(data);
    if (!parsed.success) {
      await logApp("error", "api-football", "Team payload validation failed", { issues: JSON.parse(JSON.stringify(parsed.error.issues)) });
      return [];
    }

    return parsed.data.response.map(({ team }) => mapApiFootballTeam(team));
  }

  async getWorldCupMatches(): Promise<ProviderMatch[]> {
    if (!this.isConfigured()) return [];
    const url = `${env.API_FOOTBALL_BASE_URL}/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${WORLD_CUP_SEASON}`;
    const data = await cachedJsonFetch<ApiFootballFixtureResponse>({
      provider: this.name,
      cacheKey: `fixtures:${WORLD_CUP_SEASON}`,
      url,
      headers: { "x-apisports-key": env.API_FOOTBALL_KEY },
      quotaLimit: env.API_FOOTBALL_DAILY_LIMIT
    });
    assertNoApiFootballErrors(data);

    const parsed = apiFootballFixtureResponseSchema.safeParse(data);
    if (!parsed.success) {
      await logApp("error", "api-football", "Fixture payload validation failed", { issues: JSON.parse(JSON.stringify(parsed.error.issues)) });
      return [];
    }

    return parsed.data.response.map((item) => mapApiFootballFixture(item));
  }

  async getWorldCupSquads(): Promise<ProviderSquad[]> {
    if (!this.includeDetails) return [];
    if (!this.isConfigured()) return [];
    const teams = await this.getWorldCupTeams();
    const squads: ProviderSquad[] = [];
    for (const team of teams) {
      const data = await cachedJsonFetch<unknown>({
        provider: this.name,
        cacheKey: `squad:${WORLD_CUP_SEASON}:${team.providerId}`,
        url: `${env.API_FOOTBALL_BASE_URL}/players/squads?team=${team.providerId}`,
        headers: { "x-apisports-key": env.API_FOOTBALL_KEY },
        quotaLimit: env.API_FOOTBALL_DAILY_LIMIT
      });
      assertNoApiFootballErrors(data);
      const parsed = apiFootballSquadResponseSchema.safeParse(data);
      if (parsed.success) squads.push(...parsed.data.response.map((item) => mapApiFootballSquad(item)));
      else await logApp("error", "api-football", "Squad payload validation failed", { providerId: team.providerId, issues: JSON.parse(JSON.stringify(parsed.error.issues)) });
    }
    return squads;
  }

  async getWorldCupPlayers(): Promise<ProviderPlayer[]> {
    if (!this.includeDetails) return [];
    if (!this.isConfigured()) return [];
    const teams = await this.getWorldCupTeams();
    const players: ProviderPlayer[] = [];
    for (const team of teams) {
      const data = await cachedJsonFetch<unknown>({
        provider: this.name,
        cacheKey: `players:${WORLD_CUP_SEASON}:${team.providerId}`,
        url: `${env.API_FOOTBALL_BASE_URL}/players?team=${team.providerId}&league=${WORLD_CUP_LEAGUE_ID}&season=${WORLD_CUP_SEASON}`,
        headers: { "x-apisports-key": env.API_FOOTBALL_KEY },
        quotaLimit: env.API_FOOTBALL_DAILY_LIMIT
      });
      assertNoApiFootballErrors(data);
      const parsed = apiFootballPlayersResponseSchema.safeParse(data);
      if (parsed.success) players.push(...parsed.data.response.map((item) => mapApiFootballPlayer(item)));
      else await logApp("error", "api-football", "Players payload validation failed", { providerId: team.providerId, issues: JSON.parse(JSON.stringify(parsed.error.issues)) });
    }
    return players;
  }

  async getWorldCupLineups(): Promise<ProviderLineup[]> {
    if (!this.includeDetails) return [];
    return this.getFixtureDetailCollection("lineups", apiFootballLineupResponseSchema, mapApiFootballLineups);
  }

  async getWorldCupEvents(): Promise<ProviderEvent[]> {
    if (!this.includeDetails) return [];
    return this.getFixtureDetailCollection("events", apiFootballEventsResponseSchema, mapApiFootballEvents);
  }

  async getWorldCupMatchStatistics(): Promise<ProviderMatchStatistic[]> {
    if (!this.includeDetails) return [];
    return this.getFixtureDetailCollection("statistics", apiFootballFixtureStatisticsResponseSchema, mapApiFootballFixtureStatistics);
  }

  async getWorldCupTeamStatistics(): Promise<ProviderTeamStatistic[]> {
    if (!this.includeDetails) return [];
    if (!this.isConfigured()) return [];
    const teams = await this.getWorldCupTeams();
    const stats: ProviderTeamStatistic[] = [];
    for (const team of teams) {
      const data = await cachedJsonFetch<unknown>({
        provider: this.name,
        cacheKey: `team-statistics:${WORLD_CUP_SEASON}:${team.providerId}`,
        url: `${env.API_FOOTBALL_BASE_URL}/teams/statistics?league=${WORLD_CUP_LEAGUE_ID}&season=${WORLD_CUP_SEASON}&team=${team.providerId}`,
        headers: { "x-apisports-key": env.API_FOOTBALL_KEY },
        quotaLimit: env.API_FOOTBALL_DAILY_LIMIT
      });
      assertNoApiFootballErrors(data);
      const parsed = apiFootballTeamStatisticsResponseSchema.safeParse(data);
      if (parsed.success) stats.push(mapApiFootballTeamStatistics(team.providerId, parsed.data));
      else await logApp("error", "api-football", "Team statistics payload validation failed", { providerId: team.providerId, issues: JSON.parse(JSON.stringify(parsed.error.issues)) });
    }
    return stats;
  }

  private async getFixtureDetailCollection<TSchema extends { safeParse: (data: unknown) => { success: true; data: any } | { success: false; error: { issues: unknown[] } } }, TResult>(
    endpoint: string,
    schema: TSchema,
    mapper: (matchProviderId: string, data: any) => TResult[]
  ): Promise<TResult[]> {
    if (!this.isConfigured()) return [];
    const matches = await this.getWorldCupMatches();
    const rows: TResult[] = [];
    for (const match of matches) {
      const data = await cachedJsonFetch<unknown>({
        provider: this.name,
        cacheKey: `fixture-${endpoint}:${match.providerId}`,
        url: `${env.API_FOOTBALL_BASE_URL}/fixtures/${endpoint}?fixture=${match.providerId}`,
        headers: { "x-apisports-key": env.API_FOOTBALL_KEY },
        quotaLimit: env.API_FOOTBALL_DAILY_LIMIT
      });
      assertNoApiFootballErrors(data);
      const parsed = schema.safeParse(data);
      if (parsed.success) rows.push(...mapper(match.providerId, parsed.data));
      else await logApp("error", "api-football", `Fixture ${endpoint} payload validation failed`, { providerId: match.providerId, issues: JSON.parse(JSON.stringify(parsed.error.issues)) });
    }
    return rows;
  }
}
