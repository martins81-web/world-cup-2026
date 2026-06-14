import { MatchStatus, ProviderName } from "@prisma/client";
import { env } from "@/lib/env";
import { cachedJsonFetch } from "@/lib/providers/http-cache";
import type { FootballProvider, ProviderMatch, ProviderTeam } from "@/lib/providers/types";

type SportsDbEvent = {
  idEvent: string;
  strEvent?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  idHomeTeam?: string;
  idAwayTeam?: string;
  dateEvent?: string;
  strTimestamp?: string;
  strVenue?: string;
  strCity?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strRound?: string;
  strStatus?: string;
};

type SportsDbResponse = { events?: SportsDbEvent[] };

export class TheSportsDbProvider implements FootballProvider {
  readonly name = ProviderName.THESPORTSDB;

  isConfigured() {
    return env.THESPORTSDB_KEY.length > 0;
  }

  async getWorldCupTeams(): Promise<ProviderTeam[]> {
    return [];
  }

  async getWorldCupMatches(): Promise<ProviderMatch[]> {
    if (!this.isConfigured()) return [];
    const url = `${env.THESPORTSDB_BASE_URL}/${env.THESPORTSDB_KEY}/eventsseason.php?s=2026-2027&id=4429`;
    const data = await cachedJsonFetch<SportsDbResponse>({
      provider: this.name,
      cacheKey: "events:world-cup-2026",
      url
    });

    return (data.events ?? []).map((event) => ({
      provider: this.name,
      providerId: event.idEvent,
      stage: event.strRound || "World Cup",
      stageOrder: event.strRound?.includes("Group") ? 1 : 2,
      groupName: event.strRound?.match(/Group [A-L]/)?.[0],
      kickoffAt: new Date(event.strTimestamp || event.dateEvent || "2026-06-11T00:00:00Z"),
      venue: event.strVenue,
      city: event.strCity,
      status: event.strStatus === "Match Finished" ? MatchStatus.FINISHED : MatchStatus.SCHEDULED,
      homeTeam: event.idHomeTeam && event.strHomeTeam ? {
        provider: this.name,
        providerId: event.idHomeTeam,
        name: event.strHomeTeam,
        country: event.strHomeTeam
      } : undefined,
      awayTeam: event.idAwayTeam && event.strAwayTeam ? {
        provider: this.name,
        providerId: event.idAwayTeam,
        name: event.strAwayTeam,
        country: event.strAwayTeam
      } : undefined,
      homeScore: event.intHomeScore == null ? undefined : Number(event.intHomeScore),
      awayScore: event.intAwayScore == null ? undefined : Number(event.intAwayScore)
    }));
  }
}
