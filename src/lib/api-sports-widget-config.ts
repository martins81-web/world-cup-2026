import { env } from "@/lib/env";
import type { ApiSportsWidgetConfig } from "@/lib/api-sports-widgets";

export function getApiSportsWidgetConfig(): ApiSportsWidgetConfig {
  return {
    enabled: env.API_SPORTS_WIDGETS_ENABLED,
    widgetKey: env.API_SPORTS_WIDGETS_KEY.trim(),
    host: env.API_SPORTS_WIDGETS_HOST.trim(),
    leagueId: env.API_SPORTS_WIDGETS_LEAGUE_ID,
    season: env.API_SPORTS_WIDGETS_SEASON,
    theme: env.API_SPORTS_WIDGETS_THEME,
    lang: env.API_SPORTS_WIDGETS_LANG
  };
}
