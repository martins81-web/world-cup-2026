import { MatchStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { loadLocalWorldCup2026Dataset } from "@/lib/providers/worldcup2026";
import { selectUpcomingMatches } from "@/lib/tournament/upcoming";

function match(input: { id: string; status: MatchStatus | string; kickoffAt: string; home?: string; away?: string }) {
  return {
    id: input.id,
    status: input.status,
    kickoffAt: new Date(input.kickoffAt),
    homeTeam: input.home ? { name: input.home } : null,
    awayTeam: input.away ? { name: input.away } : null
  };
}

describe("selectUpcomingMatches", () => {
  it("returns upcoming matches from the seeded 2026 dataset", () => {
    const dataset = loadLocalWorldCup2026Dataset();
    const upcoming = selectUpcomingMatches(dataset.matches, new Date("2026-06-01T00:00:00.000Z"), 6);

    expect(upcoming).toHaveLength(6);
    expect(upcoming[0]).toMatchObject({ providerId: "1", status: MatchStatus.SCHEDULED });
    expect(upcoming.map((item) => `${item.homeTeam?.name ?? ""} ${item.awayTeam?.name ?? ""}`).join(" ")).not.toMatch(/Development/);
  });

  it("sorts scheduled matches by kickoff date", () => {
    const upcoming = selectUpcomingMatches([
      match({ id: "late", status: MatchStatus.SCHEDULED, kickoffAt: "2026-06-13T12:00:00Z" }),
      match({ id: "early", status: MatchStatus.SCHEDULED, kickoffAt: "2026-06-12T12:00:00Z" })
    ], new Date("2026-06-01T00:00:00Z"));

    expect(upcoming.map((item) => item.id)).toEqual(["early", "late"]);
  });

  it("does not show completed matches before scheduled matches", () => {
    const upcoming = selectUpcomingMatches([
      match({ id: "finished", status: MatchStatus.FINISHED, kickoffAt: "2026-06-12T12:00:00Z" }),
      match({ id: "scheduled", status: MatchStatus.SCHEDULED, kickoffAt: "2026-06-13T12:00:00Z" })
    ], new Date("2026-06-12T00:00:00Z"));

    expect(upcoming[0].id).toBe("scheduled");
  });

  it("falls back to scheduled fixture order after all scheduled fixture dates", () => {
    const upcoming = selectUpcomingMatches([
      match({ id: "one", status: MatchStatus.SCHEDULED, kickoffAt: "2026-06-12T12:00:00Z" }),
      match({ id: "two", status: MatchStatus.SCHEDULED, kickoffAt: "2026-06-13T12:00:00Z" })
    ], new Date("2027-01-01T00:00:00Z"));

    expect(upcoming.map((item) => item.id)).toEqual(["one", "two"]);
  });

  it("falls back to dated matches only when no scheduled matches exist", () => {
    const upcoming = selectUpcomingMatches([
      match({ id: "finished", status: MatchStatus.FINISHED, kickoffAt: "2026-06-12T12:00:00Z" })
    ], new Date("2026-06-01T00:00:00Z"));

    expect(upcoming[0].id).toBe("finished");
  });
});
