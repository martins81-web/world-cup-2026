import { ConfiguredApiSportsWidget } from "@/components/widgets/api-sports-widget-config";

export function ApiSportsGameWidget({ fixture, title = "API-Sports fixture widget" }: { fixture?: string | number | null; title?: string }) {
  if (!fixture) {
    return (
      <section className="min-w-0 rounded-md border border-black/10 bg-white p-3" aria-label={title} data-testid="widget-fallback">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-black/60">Fixture details will appear after API-Football maps the local match.</p>
      </section>
    );
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
