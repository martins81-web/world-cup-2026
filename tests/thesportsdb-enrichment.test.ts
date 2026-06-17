import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe("TheSportsDB enrichment provider", () => {
  it("skips cleanly when disabled", async () => {
    const { TheSportsDbProvider } = await loadProvider({ THESPORTSDB_ENABLED: "false", THESPORTSDB_KEY: "123" });
    const provider = new TheSportsDbProvider();

    expect(provider.isConfigured()).toBe(false);
    await expect(provider.syncEnrichmentOnly()).resolves.toMatchObject({
      status: "skipped",
      teamsSeen: 0,
      matchesSeen: 0,
      message: "TheSportsDB enrichment is disabled."
    });
  });

  it("skips cleanly when enabled without a key", async () => {
    const { TheSportsDbProvider } = await loadProvider({ THESPORTSDB_ENABLED: "true", THESPORTSDB_KEY: "" });
    const provider = new TheSportsDbProvider();

    expect(provider.isConfigured()).toBe(false);
    await expect(provider.syncEnrichmentOnly()).resolves.toMatchObject({
      status: "skipped",
      message: "TheSportsDB enrichment skipped because THESPORTSDB_KEY is missing."
    });
  });

  it("does not crash when endpoints fail", async () => {
    const { TheSportsDbProvider } = await loadProvider({ THESPORTSDB_ENABLED: "true", THESPORTSDB_KEY: "123" });
    const provider = new TheSportsDbProvider(async () => {
      throw new Error("HTTP 503");
    });

    const enrichment = await provider.getEnrichment();
    const result = await provider.syncEnrichmentOnly();

    expect(enrichment.teams).toEqual([]);
    expect(enrichment.errors.length).toBeGreaterThan(0);
    expect(result).toMatchObject({ status: "failed", teamsSeen: 0, matchesSeen: 0 });
  });

  it("keeps TheSportsDB as enrichment and does not expose ingest teams or matches", async () => {
    const { TheSportsDbProvider } = await loadProvider({ THESPORTSDB_ENABLED: "true", THESPORTSDB_KEY: "123" });
    const provider = new TheSportsDbProvider(async ({ cacheKey }) => {
      if (cacheKey.includes("teams")) return { teams: [{ idTeam: "1", strTeam: "Provider Name" }] } as any;
      if (cacheKey.includes("events")) return { events: [{ idEvent: "10", strHomeTeam: "Mexico", strAwayTeam: "South Africa" }] } as any;
      return { leagues: [{ idLeague: "4429" }] } as any;
    });

    await expect(provider.getWorldCupTeams()).resolves.toEqual([]);
    await expect(provider.getWorldCupMatches()).resolves.toEqual([]);
    await expect(provider.syncEnrichmentOnly()).resolves.toMatchObject({
      status: "success",
      teamsSeen: 1,
      matchesSeen: 1
    });
  });

  it("loads event statistics from the documented v1 endpoint", async () => {
    const { TheSportsDbProvider } = await loadProvider({ THESPORTSDB_ENABLED: "true", THESPORTSDB_KEY: "123" });
    const requestedUrls: string[] = [];
    const provider = new TheSportsDbProvider(async ({ url }) => {
      requestedUrls.push(url);
      return {
        eventstats: [
          { idStatistic: "1", idEvent: "1032723", strStat: "Shots", intHome: "12", intAway: "8" }
        ]
      } as any;
    });

    const stats = await provider.getEventStatistics("1032723");

    expect(requestedUrls[0]).toBe("https://www.thesportsdb.com/api/v1/json/123/lookupeventstats.php?id=1032723");
    expect(stats).toEqual([
      { idStatistic: "1", idEvent: "1032723", strStat: "Shots", intHome: "12", intAway: "8" }
    ]);
  });
});

describe("TheSportsDB widget enrichment matching", () => {
  it("matches local-only widget data without placeholders", async () => {
    const { findSportsDbEvent, findSportsDbTeam } = await import("@/lib/providers/thesportsdb");
    const match = localMatch();
    const team = localTeam();

    expect(`${match.homeTeam.name} ${match.awayTeam.name}`).not.toMatch(/Development/);
    expect(findSportsDbEvent(match, [])).toBeUndefined();
    expect(findSportsDbTeam(team, [])).toBeUndefined();
  });

  it("matches enriched event and team artwork for widgets", async () => {
    const { findSportsDbEvent, findSportsDbTeam, sportsDbImageUrl } = await import("@/lib/providers/thesportsdb");

    const matchedEvent = findSportsDbEvent(localMatch(), [sportsDbEvent()]);
    const matchedTeam = findSportsDbTeam(localTeam(), [{ idTeam: "1", strTeam: "Mexico", strTeamBadge: "https://cdn.example/mexico.png" }]);

    expect(matchedEvent?.idEvent).toBe("event-1");
    expect(matchedTeam?.idTeam).toBe("1");
    expect(sportsDbImageUrl(matchedEvent?.strThumb)).toBe("https://cdn.example/match.jpg/small");
    expect(sportsDbImageUrl(matchedTeam?.strTeamBadge)).toBe("https://cdn.example/mexico.png/small");
  });
});

async function loadProvider(overrides: Record<string, string>) {
  vi.resetModules();
  process.env = {
    ...originalEnv,
    DATABASE_URL: originalEnv.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/worldcup2026_test?schema=public",
    ADMIN_SYNC_TOKEN: originalEnv.ADMIN_SYNC_TOKEN ?? "test-admin-sync-token-123",
    ADMIN_SESSION_SECRET: originalEnv.ADMIN_SESSION_SECRET ?? "test-admin-session-secret-1234567890",
    THESPORTSDB_BASE_URL: "https://www.thesportsdb.com/api/v1/json",
    THESPORTSDB_LEAGUE_ID: "4429",
    THESPORTSDB_SEASON: "2026",
    ...overrides
  };
  return import("@/lib/providers/thesportsdb");
}

function localTeam() {
  return {
    id: "team-1",
    name: "Mexico",
    country: "Mexico",
    fifaCode: "MEX",
    badgeUrl: null,
    worldcup2026Id: "1",
    apiFootballId: null,
    sportsDbId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    groupEntries: [{ group: { name: "Group A" } }]
  };
}

function localMatch() {
  return {
    id: "match-1",
    tournamentId: "tournament-1",
    providerId: "1",
    matchNumber: 1,
    stage: "Group Stage",
    stageOrder: 1,
    knockoutRound: null,
    groupName: "Group A",
    kickoffAt: new Date("2026-06-11T19:00:00Z"),
    venue: "Estadio Azteca",
    city: "Mexico City",
    status: "SCHEDULED",
    homeTeamId: "team-1",
    awayTeamId: "team-2",
    stadiumId: null,
    homeSeed: null,
    awaySeed: null,
    homeScore: null,
    awayScore: null,
    extraTimeHome: null,
    extraTimeAway: null,
    penaltyHome: null,
    penaltyAway: null,
    winnerToMatchId: null,
    winnerToSlot: null,
    loserToMatchId: null,
    loserToSlot: null,
    sourceProvider: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    homeTeam: localTeam(),
    awayTeam: { ...localTeam(), id: "team-2", name: "South Africa", country: "South Africa", fifaCode: "RSA" }
  };
}

function sportsDbEvent() {
  return {
    idEvent: "event-1",
    strHomeTeam: "Mexico",
    strAwayTeam: "South Africa",
    strTimestamp: "2026-06-11T19:00:00Z",
    strThumb: "https://cdn.example/match.jpg"
  };
}
