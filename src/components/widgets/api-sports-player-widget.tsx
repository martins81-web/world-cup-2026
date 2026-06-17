import { ConfiguredApiSportsWidget } from "@/components/widgets/api-sports-widget-config";

export function ApiSportsPlayerWidget({ player, title = "API-Sports Player widget" }: { player?: string | number | null; title?: string }) {
  if (!player) {
    return <ConfiguredApiSportsWidget type="player" player={null} title={title} fallback="API-Sports player widget is unavailable for this local player." />;
  }

  return (
    <ConfiguredApiSportsWidget
      type="player"
      player={player}
      title={title}
      attributes={{ showErrors: false, showLogos: true }}
    />
  );
}
