import { DevelopmentNotice } from "@/components/development-notice";
import { ApiSportsGamesWidget } from "@/components/widgets/api-sports-games-widget";
import { MatchCard } from "@/components/match-card";
import { MatchFilters } from "@/components/match-filters";
import { NextMatchesWidget } from "@/components/widgets/next-matches-widget";
import { RecentResultsWidget } from "@/components/widgets/recent-results-widget";
import { getMatches, getTournament } from "@/lib/data/world-cup";
import { getTheSportsDbEnrichment, getTheSportsDbEventsForMatches } from "@/lib/providers/thesportsdb";
import { getRecentResults, getUpcomingMatches } from "@/lib/tournament/upcoming";

export const dynamic = "force-dynamic";
export const metadata = { title: "Matches | World Cup 2026" };

export default async function MatchesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const tournament = await getTournament();
  const matches = await getMatches(filters);
  const allMatches = await getMatches();
  const sportsDb = await getTheSportsDbEnrichment();
  const upcomingMatches = getUpcomingMatches(allMatches, 6);
  const recentMatches = getRecentResults(allMatches, 4);
  const sportsDbEvents = await getTheSportsDbEventsForMatches(
    [...upcomingMatches, ...recentMatches, ...matches],
    [...sportsDb.seasonEvents, ...sportsDb.nextEvents, ...sportsDb.previousEvents]
  );

  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-semibold">Matches</h1>
        <div className="mt-5">
          <h2 className="text-2xl font-semibold">Live widgets powered by API-Sports</h2>
          <div className="mt-4">
            <ApiSportsGamesWidget title="API-Sports match list" />
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <NextMatchesWidget matches={upcomingMatches} events={sportsDbEvents} title="Upcoming fixtures" />
          <RecentResultsWidget matches={recentMatches} events={sportsDbEvents} />
        </div>
        <div className="mt-5"><MatchFilters defaults={filters} /></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {matches.map((match) => <MatchCard key={match.id} match={match} events={sportsDbEvents} />)}
        </div>
        {matches.length === 0 ? <p className="mt-6">Not available</p> : null}
      </section>
    </main>
  );
}
