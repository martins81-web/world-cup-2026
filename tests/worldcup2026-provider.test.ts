import { ProviderName } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { loadLocalWorldCup2026Dataset } from "@/lib/providers/worldcup2026";

describe("World Cup 2026 open-source provider", () => {
  it("parses all local tournament entities", () => {
    const dataset = loadLocalWorldCup2026Dataset();

    expect(dataset.teams).toHaveLength(48);
    expect(dataset.groups).toHaveLength(12);
    expect(dataset.matches).toHaveLength(104);
    expect(dataset.stadiums).toHaveLength(16);
  });

  it("maps team IDs, FIFA codes, badge URLs and group assignments", () => {
    const dataset = loadLocalWorldCup2026Dataset();
    const mexico = dataset.teams.find((team) => team.fifaCode === "MEX");
    const groupA = dataset.groups.find((group) => group.name === "Group A");

    expect(mexico).toMatchObject({
      provider: ProviderName.WORLDCUP2026_OPEN_SOURCE,
      providerId: "1",
      name: "Mexico",
      badgeUrl: "https://flagcdn.com/w80/mx.png"
    });
    expect(groupA?.teamProviderIds).toEqual(["1", "2", "3", "4"]);
    expect(new Set(dataset.teams.map((team) => team.fifaCode)).size).toBe(48);
  });

  it("maps unresolved knockout labels without fake teams", () => {
    const dataset = loadLocalWorldCup2026Dataset();
    const final = dataset.matches.find((match) => match.matchNumber === 104);

    expect(final).toMatchObject({
      providerId: "104",
      stage: "Final",
      knockoutRound: "F",
      homeSeed: "Winner Match 101",
      awaySeed: "Winner Match 102"
    });
    expect(final?.homeTeam).toBeUndefined();
    expect(final?.awayTeam).toBeUndefined();
  });

  it("falls back to local data when the hosted API is unavailable", async () => {
    vi.resetModules();
    vi.stubEnv("WORLDCUP2026_API_ENABLED", "true");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));

    const { WorldCup2026OpenSourceProvider } = await import("@/lib/providers/worldcup2026");
    const provider = new WorldCup2026OpenSourceProvider();

    await expect(provider.getWorldCupTeams()).resolves.toHaveLength(48);
    await expect(provider.getWorldCupMatches()).resolves.toHaveLength(104);
    expect(["hosted API cache", "local dataset fallback"]).toContain(provider.source);
    expect(provider.errors.length).toBeGreaterThan(0);

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});
