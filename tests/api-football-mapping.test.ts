import { describe, expect, it } from "vitest";
import { apiFootballFixtureResponseSchema, apiFootballTeamResponseSchema, mapApiFootballFixture, mapApiFootballTeam } from "@/lib/providers/api-football-validation";

describe("API-Football payload validation and mapping", () => {
  it("validates and maps team payloads", () => {
    const parsed = apiFootballTeamResponseSchema.parse({
      response: [{ team: { id: 1, name: "Canada", country: "Canada", code: "CAN", logo: "https://example.test/can.png" } }]
    });

    expect(mapApiFootballTeam(parsed.response[0].team)).toMatchObject({
      providerId: "1",
      name: "Canada",
      fifaCode: "CAN"
    });
  });

  it("validates and maps fixture payloads with penalties and extra time", () => {
    const parsed = apiFootballFixtureResponseSchema.parse({
      response: [{
        fixture: { id: 88, date: "2026-07-19T19:00:00Z", venue: { name: "MetLife Stadium", city: "New York New Jersey" }, status: { short: "PEN" } },
        league: { round: "Final" },
        teams: { home: { id: 10, name: "Team A" }, away: { id: 11, name: "Team B" } },
        goals: { home: 1, away: 1 },
        score: { extratime: { home: 1, away: 1 }, penalty: { home: 4, away: 5 } }
      }]
    });

    expect(mapApiFootballFixture(parsed.response[0])).toMatchObject({
      providerId: "88",
      status: "FINISHED",
      extraTimeHome: 1,
      penaltyAway: 5
    });
  });

  it("rejects malformed fixture payloads before mapping", () => {
    expect(apiFootballFixtureResponseSchema.safeParse({ response: [{ fixture: { id: "bad" } }] }).success).toBe(false);
  });
});
