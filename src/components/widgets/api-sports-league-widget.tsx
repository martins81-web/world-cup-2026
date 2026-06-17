import { ConfiguredApiSportsWidget } from "@/components/widgets/api-sports-widget-config";

export function ApiSportsLeagueWidget() {
  return (
    <ConfiguredApiSportsWidget
      type="leagues"
      title="API-Sports League widget"
      attributes={{ showLogos: true, showErrors: false }}
    />
  );
}
