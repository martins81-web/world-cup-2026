import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { API_SPORTS_WIDGET_FALLBACK, isApiSportsWidgetAvailable } from "@/lib/api-sports-widgets";
import { API_SPORTS_WIDGET_CLASS_NAME, API_SPORTS_WIDGET_SCRIPT_SELECTOR, API_SPORTS_WIDGET_SCRIPT_SRC, apiSportsWidgetElementId, buildApiSportsDataAttributes } from "@/lib/api-sports-widget-attributes";

describe("API-Sports widget embeds", () => {
  it("treats disabled widgets as unavailable", () => {
    expect(isApiSportsWidgetAvailable({ enabled: false, widgetKey: "widget-key" })).toBe(false);
    expect(API_SPORTS_WIDGET_FALLBACK).toContain("Live API-Sports widget data is unavailable");
  });

  it("treats missing widget keys as unavailable", () => {
    expect(isApiSportsWidgetAvailable({ enabled: true, widgetKey: "" })).toBe(false);
  });

  it("builds v3 widget data attributes without leaking empty values", () => {
    expect(buildApiSportsDataAttributes({
      host: "v3.football.api-sports.io",
      key: "123",
      widget: "players",
      league: 1,
      season: 2026,
      showErrors: false,
      player: null
    })).toEqual({
      "data-host": "v3.football.api-sports.io",
      "data-key": "123",
      "data-widget": "players",
      "data-league": "1",
      "data-season": "2026",
      "data-show-errors": "false"
    });
  });

  it("uses one stable script selector and the documented widget script host", () => {
    expect(API_SPORTS_WIDGET_SCRIPT_SELECTOR).toBe("script[data-api-sports-widgets-v3]");
    expect(API_SPORTS_WIDGET_SCRIPT_SRC).toBe("https://widgets.api-sports.io/2.0.3/widgets.js");
    expect(API_SPORTS_WIDGET_CLASS_NAME).toBe("api_football_loader");
    expect(apiSportsWidgetElementId("games", "1")).toBe("wg-api-football-games");
  });

  it("includes players and team fallback messages", () => {
    const playerWidget = source("src/components/widgets/api-sports-player-widget.tsx");
    const teamWidget = source("src/components/widgets/api-sports-team-widget.tsx");

    expect(playerWidget).toContain("unavailable for this local player");
    expect(teamWidget).toContain("unavailable for this local team");
  });

  it("homepage uses the competition dashboard while keeping local widgets", () => {
    const homePage = source("src/app/page.tsx");

    expect(homePage).toContain("ApiSportsCompetitionDashboard");
    expect(homePage).toContain("FeaturedMatchWidget");
    expect(homePage).toContain("NextMatchesWidget");
    expect(homePage).toContain("RecentResultsWidget");
  });

  it("live center exposes every widget supported by the official loader", () => {
    const livePage = source("src/app/live/page.tsx");
    const dashboard = source("src/components/widgets/api-sports-competition-dashboard.tsx");

    for (const widget of [
      "ApiSportsGamesWidget",
      "ApiSportsStandingsWidget"
    ]) {
      expect(dashboard).toContain(widget);
    }

    expect(livePage).toContain("ApiSportsGameWidget");
    expect(livePage).not.toContain("ApiSportsTeamWidget");
    expect(livePage).not.toContain("ApiSportsPlayerWidget");
  });

  it("replays widget initialization after Next.js renders", () => {
    const widget = source("src/components/widgets/api-sports-widget.tsx");
    expect(widget).toContain('window.dispatchEvent(new Event("DOMContentLoaded"))');
  });
});

describe("match card layout", () => {
  it("uses flex rows and breakable team names", () => {
    const matchCard = source("src/components/match-card.tsx");

    expect(matchCard).toContain("flex min-w-0 items-center gap-2");
    expect(matchCard).toContain("min-w-0 flex-1 break-words whitespace-normal");
    expect(matchCard).toContain("shrink-0");
  });
});

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}
