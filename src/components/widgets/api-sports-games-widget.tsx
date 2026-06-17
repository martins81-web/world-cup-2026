import { ConfiguredApiSportsWidget } from "@/components/widgets/api-sports-widget-config";

export function ApiSportsGamesWidget({ title = "API-Sports Games widget" }: { title?: string }) {
  return (
    <ConfiguredApiSportsWidget
      type="games"
      title={title}
      attributes={{
        showToolbar: true,
        showErrors: false,
        showLogos: true,
        modalGame: true,
        modalStandings: true,
        modalShowLogos: true
      }}
    />
  );
}
