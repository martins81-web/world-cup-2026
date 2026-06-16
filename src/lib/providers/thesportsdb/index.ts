import { ProviderName } from "@prisma/client";
import { env } from "@/lib/env";
import { cachedJsonFetch } from "@/lib/providers/http-cache";
import type { FootballProvider, ProviderMatch, ProviderTeam } from "@/lib/providers/types";

export type SportsDbTeam = {
  idTeam: string;
  strTeam?: string;
  strTeamShort?: string;
  strCountry?: string;
  strTeamBadge?: string;
  strTeamLogo?: string;
  strTeamFanart1?: string;
  strTeamFanart2?: string;
  strTeamJersey?: string;
  strDescriptionEN?: string;
};

export type SportsDbEvent = {
  idEvent: string;
  strEvent?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  idHomeTeam?: string;
  idAwayTeam?: string;
  dateEvent?: string;
  strTimestamp?: string;
  strTime?: string;
  strVenue?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strStatus?: string;
  strRound?: string;
  strThumb?: string;
  strBanner?: string;
  strPoster?: string;
  strFanart?: string;
};

export type TheSportsDbEnrichment = {
  enabled: boolean;
  source: string;
  league?: unknown;
  teams: SportsDbTeam[];
  seasonEvents: SportsDbEvent[];
  nextEvents: SportsDbEvent[];
  previousEvents: SportsDbEvent[];
  errors: string[];
};

type FetchJson = <T>(options: { cacheKey: string; url: string }) => Promise<T>;
type EnrichmentSyncResult = Awaited<ReturnType<NonNullable<FootballProvider["syncEnrichmentOnly"]>>>;

type SportsDbListResponse = {
  leagues?: unknown[];
  teams?: SportsDbTeam[] | null;
  events?: SportsDbEvent[] | null;
};

export class TheSportsDbProvider implements FootballProvider {
  readonly name = ProviderName.THESPORTSDB;
  readonly source = "TheSportsDB enrichment";
  readonly errors: string[] = [];
  private readonly fetchJson: FetchJson;

  constructor(fetchJson: FetchJson = defaultFetchJson) {
    this.fetchJson = fetchJson;
  }

  isConfigured() {
    return env.THESPORTSDB_ENABLED && env.THESPORTSDB_KEY.trim().length > 0;
  }

  configurationMessage() {
    if (!env.THESPORTSDB_ENABLED) return "TheSportsDB enrichment is disabled.";
    if (!env.THESPORTSDB_KEY.trim()) return "TheSportsDB enrichment skipped because THESPORTSDB_KEY is missing.";
    return "TheSportsDB enrichment is configured.";
  }

  async getWorldCupTeams(): Promise<ProviderTeam[]> {
    return [];
  }

  async getWorldCupMatches(): Promise<ProviderMatch[]> {
    return [];
  }

  async syncEnrichmentOnly(): Promise<EnrichmentSyncResult> {
    if (!this.isConfigured()) {
      return {
        status: "skipped" as const,
        message: this.configurationMessage(),
        teamsSeen: 0,
        matchesSeen: 0,
        groupsSeen: 0,
        stadiumsSeen: 0,
        source: this.source,
        errors: this.errors
      };
    }

    const enrichment = await this.getEnrichment();
    const matchesSeen = uniqueEvents([...enrichment.seasonEvents, ...enrichment.nextEvents, ...enrichment.previousEvents]).length;
    const status: EnrichmentSyncResult["status"] = enrichment.errors.length > 0
      ? (enrichment.teams.length > 0 || matchesSeen > 0 ? "partial" : "failed")
      : "success";

    return {
      status,
      message: status === "success"
        ? "TheSportsDB enrichment checked successfully; local tournament data was retained."
        : "TheSportsDB enrichment completed with errors; local tournament data was retained.",
      teamsSeen: enrichment.teams.length,
      matchesSeen,
      groupsSeen: 0,
      stadiumsSeen: 0,
      source: this.source,
      errors: enrichment.errors
    };
  }

  async getEnrichment(): Promise<TheSportsDbEnrichment> {
    if (!this.isConfigured()) {
      return {
        enabled: false,
        source: this.source,
        teams: [],
        seasonEvents: [],
        nextEvents: [],
        previousEvents: [],
        errors: [this.configurationMessage()]
      };
    }

    const [league, teams, seasonEvents, nextEvents, previousEvents] = await Promise.all([
      this.readEndpoint<SportsDbListResponse>("league", `lookupleague.php?id=${encodeURIComponent(env.THESPORTSDB_LEAGUE_ID)}`),
      this.readEndpoint<SportsDbListResponse>("teams", `search_all_teams.php?l=FIFA%20World%20Cup`),
      this.readEndpoint<SportsDbListResponse>("events-season", `eventsseason.php?id=${encodeURIComponent(env.THESPORTSDB_LEAGUE_ID)}&s=${encodeURIComponent(env.THESPORTSDB_SEASON)}`),
      this.readEndpoint<SportsDbListResponse>("events-next", `eventsnextleague.php?id=${encodeURIComponent(env.THESPORTSDB_LEAGUE_ID)}`),
      this.readEndpoint<SportsDbListResponse>("events-previous", `eventspastleague.php?id=${encodeURIComponent(env.THESPORTSDB_LEAGUE_ID)}`)
    ]);

    return {
      enabled: true,
      source: this.source,
      league: league.data?.leagues?.[0],
      teams: teams.data?.teams ?? [],
      seasonEvents: seasonEvents.data?.events ?? [],
      nextEvents: nextEvents.data?.events ?? [],
      previousEvents: previousEvents.data?.events ?? [],
      errors: this.errors
    };
  }

  async getEventDetails(eventId: string) {
    const result = await this.readEndpoint<SportsDbListResponse>(`event:${eventId}`, `lookupevent.php?id=${encodeURIComponent(eventId)}`);
    return result.data?.events?.[0];
  }

  async getTeamDetails(teamId: string) {
    const result = await this.readEndpoint<SportsDbListResponse>(`team:${teamId}`, `lookupteam.php?id=${encodeURIComponent(teamId)}`);
    return result.data?.teams?.[0];
  }

  private async readEndpoint<T>(cacheKey: string, path: string) {
    try {
      return {
        data: await this.fetchJson<T>({
          cacheKey: `thesportsdb:${env.THESPORTSDB_LEAGUE_ID}:${env.THESPORTSDB_SEASON}:${cacheKey}`,
          url: buildTheSportsDbUrl(path)
        })
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown TheSportsDB error";
      this.errors.push(`${cacheKey}: ${message}`);
      return { data: undefined };
    }
  }
}

export async function getTheSportsDbEnrichment() {
  return new TheSportsDbProvider().getEnrichment();
}

export function findSportsDbTeam(localTeam: { name: string; fifaCode?: string | null; sportsDbId?: string | null }, teams: SportsDbTeam[]) {
  if (localTeam.sportsDbId) {
    const mapped = teams.find((team) => team.idTeam === localTeam.sportsDbId);
    if (mapped) return mapped;
  }
  const localName = normalizeSportsDbName(localTeam.name);
  return teams.find((team) => normalizeSportsDbName(team.strTeam ?? "") === localName);
}

export function findSportsDbEvent(
  localMatch: {
    kickoffAt?: Date | string | null;
    homeTeam?: { name: string; sportsDbId?: string | null } | null;
    awayTeam?: { name: string; sportsDbId?: string | null } | null;
  },
  events: SportsDbEvent[]
) {
  const homeName = normalizeSportsDbName(localMatch.homeTeam?.name ?? "");
  const awayName = normalizeSportsDbName(localMatch.awayTeam?.name ?? "");
  if (!homeName || !awayName) return undefined;

  const localDate = toDateKey(localMatch.kickoffAt);
  const byTeams = events.filter((event) => {
    const eventHome = normalizeSportsDbName(event.strHomeTeam ?? "");
    const eventAway = normalizeSportsDbName(event.strAwayTeam ?? "");
    return eventHome === homeName && eventAway === awayName;
  });

  if (localDate) {
    const byDate = byTeams.find((event) => toDateKey(event.strTimestamp ?? event.dateEvent) === localDate);
    if (byDate) return byDate;
  }

  return byTeams[0];
}

export function sportsDbImageUrl(...candidates: Array<string | null | undefined>) {
  return candidates.find((candidate) => typeof candidate === "string" && /^https?:\/\//i.test(candidate));
}

export function normalizeSportsDbName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(united states|usa|usmnt)\b/g, "united states")
    .replace(/\b(korea republic|south korea)\b/g, "south korea")
    .replace(/\b(ir iran|iran)\b/g, "iran")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toDateKey(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function uniqueEvents(events: SportsDbEvent[]) {
  return [...new Map(events.map((event) => [event.idEvent, event])).values()];
}

function buildTheSportsDbUrl(path: string) {
  const baseUrl = env.THESPORTSDB_BASE_URL.replace(/\/$/, "");
  const key = encodeURIComponent(env.THESPORTSDB_KEY.trim());
  return `${baseUrl}/${key}/${path}`;
}

function defaultFetchJson<T>(options: { cacheKey: string; url: string }) {
  return cachedJsonFetch<T>({
    provider: ProviderName.THESPORTSDB,
    cacheKey: options.cacheKey,
    url: options.url
  });
}
