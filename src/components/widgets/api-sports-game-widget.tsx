import { ConfiguredApiSportsWidget } from "@/components/widgets/api-sports-widget-config";

export function ApiSportsGameWidget({ fixture, title = "API-Sports fixture widget" }: { fixture?: string | number | null; title?: string }) {
  if (!fixture) {
    return <ConfiguredApiSportsWidget type="game" fixture={null} title={title} fallback="API-Sports match widget is unavailable for this local fixture." />;
  }

  return (
    <ConfiguredApiSportsWidget
      type="game"
      fixture={fixture}
      title={title}
      attributes={{
        showErrors: false,
        showLogos: true,
        showLineups: true,
        showStatistics: true,
        showEvents: true,
        showPlayers: true
      }}
    />
  );
}
