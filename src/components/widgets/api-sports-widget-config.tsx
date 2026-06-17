import { API_SPORTS_WIDGET_FALLBACK } from "@/lib/api-sports-widgets";
import { getApiSportsWidgetConfig } from "@/lib/api-sports-widget-config";
import { ApiSportsWidget, type ApiSportsWidgetProps } from "@/components/widgets/api-sports-widget";

type ConfiguredWidgetProps = Omit<ApiSportsWidgetProps, "enabled" | "widgetKey" | "host" | "league" | "season" | "theme" | "lang"> & {
  league?: string | number | null;
  season?: string | number | null;
};

export function ConfiguredApiSportsWidget({ fallback = API_SPORTS_WIDGET_FALLBACK, ...props }: ConfiguredWidgetProps) {
  const config = getApiSportsWidgetConfig();

  return (
    <ApiSportsWidget
      {...props}
      enabled={config.enabled}
      widgetKey={config.widgetKey}
      host={config.host}
      league={props.league ?? config.leagueId}
      season={props.season ?? config.season}
      theme={config.theme}
      lang={config.lang}
      fallback={fallback}
    />
  );
}
