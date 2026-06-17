import { ConfiguredApiSportsWidget } from "@/components/widgets/api-sports-widget-config";

export function ApiSportsStandingsWidget({ title = "API-Sports Standings widget" }: { title?: string }) {
  return (
    <ConfiguredApiSportsWidget
      type="standings"
      title={title}
      attributes={{ showErrors: false, showLogos: true }}
    />
  );
}
