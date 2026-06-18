import { ApiSportsGamesWidget } from "@/components/widgets/api-sports-games-widget";
import { ApiSportsStandingsWidget } from "@/components/widgets/api-sports-standings-widget";

export function ApiSportsCompetitionDashboard({
  title = "World Cup live center"
}: {
  title?: string;
}) {
  return (
    <section aria-labelledby="api-sports-dashboard-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase text-black/55">Powered by API-Sports</p>
          <h2 id="api-sports-dashboard-title" className="mt-1 text-2xl font-semibold">{title}</h2>
        </div>
      </div>
      <div className="mt-5 grid min-w-0 gap-5">
        <ApiSportsGamesWidget title="Fixtures and live scores" />
        <ApiSportsStandingsWidget title="Live standings" />
      </div>
    </section>
  );
}
