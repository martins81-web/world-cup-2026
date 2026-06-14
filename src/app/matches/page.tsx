import { DevelopmentNotice } from "@/components/development-notice";
import { ApiSportsWidget } from "@/components/api-sports-widget";
import { MatchCard } from "@/components/match-card";
import { MatchFilters } from "@/components/match-filters";
import { getMatches, getTournament } from "@/lib/data/world-cup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Matches | World Cup 2026" };

export default async function MatchesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const tournament = await getTournament();
  const matches = await getMatches(filters);

  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-semibold">Matches</h1>
        <div className="mt-5">
          <ApiSportsWidget type="games" title="API-Sports match list" fallback={<p className="text-sm text-black/60">Widget not available. Custom match list is shown below.</p>} />
        </div>
        <div className="mt-5"><MatchFilters defaults={filters} /></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {matches.map((match) => <MatchCard key={match.id} match={match} />)}
        </div>
        {matches.length === 0 ? <p className="mt-6">Not available</p> : null}
      </section>
    </main>
  );
}
