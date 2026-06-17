import { ConfiguredApiSportsWidget } from "@/components/widgets/api-sports-widget-config";

export function ApiSportsPlayersWidget({ team, title = "API-Sports Players widget" }: { team?: string | number | null; title?: string }) {
  return (
    <ConfiguredApiSportsWidget
      type="players"
      team={team}
      title={title}
      attributes={{ showErrors: false, showLogos: true }}
    />
  );
}
