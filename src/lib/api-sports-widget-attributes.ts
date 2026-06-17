export const API_SPORTS_WIDGET_SCRIPT_SRC = "https://widgets.api-sports.io/2.0.3/widgets.js";
export const API_SPORTS_WIDGET_SCRIPT_SELECTOR = "script[data-api-sports-widgets-v3]";
export const API_SPORTS_WIDGET_CLASS_NAME = "api_football_loader";

const widgetIds: Record<string, string> = {
  leagues: "wg-api-football-leagues",
  games: "wg-api-football-games",
  game: "wg-api-football-game",
  standings: "wg-api-football-standings",
  teams: "wg-api-football-teams",
  team: "wg-api-football-team",
  player: "wg-api-football-player",
  players: "wg-api-football-players"
};

export function apiSportsWidgetElementId(type: string, _instanceId: string) {
  return widgetIds[type] ?? `wg-api-football-${type}`;
}

export function buildApiSportsDataAttributes(input: Record<string, string | number | boolean | null | undefined>) {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => value !== null && value !== undefined && value !== "")
      .map(([key, value]) => [`data-${toKebabCase(key)}`, String(value)])
  );
}

function toKebabCase(value: string) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}
