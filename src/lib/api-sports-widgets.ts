export type ApiSportsWidgetTheme = "light" | "dark";

export type ApiSportsWidgetConfig = {
  enabled: boolean;
  widgetKey: string;
  host: string;
  leagueId: string;
  season: string;
  theme: ApiSportsWidgetTheme;
  lang: string;
};

export const API_SPORTS_WIDGET_FALLBACK = "Live API-Sports widget data is unavailable for this season on the current plan.";

export function isApiSportsWidgetAvailable(config: Pick<ApiSportsWidgetConfig, "enabled" | "widgetKey">) {
  return config.enabled && config.widgetKey.length > 0;
}
