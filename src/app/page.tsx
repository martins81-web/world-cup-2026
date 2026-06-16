import Link from "next/link";
import { ApiSportsWidget } from "@/components/api-sports-widget";
import { DevelopmentNotice } from "@/components/development-notice";
import { FeaturedMatchWidget } from "@/components/widgets/featured-match-widget";
import { NextMatchesWidget } from "@/components/widgets/next-matches-widget";
import { RecentResultsWidget } from "@/components/widgets/recent-results-widget";
import { TeamShowcaseWidget } from "@/components/widgets/team-showcase-widget";
import { getGroupsWithTables, getMatches, getTeams, getThirdPlaceRanking, getTournament } from "@/lib/data/world-cup";
import { getTheSportsDbEnrichment } from "@/lib/providers/thesportsdb";
import { selectUpcomingMatches } from "@/lib/tournament/upcoming";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tournament = await getTournament();
  const matches = await getMatches();
  const { teams } = await getTeams();
  const { tables } = await getGroupsWithTables();
  const { ranking } = await getThirdPlaceRanking();
  const sportsDb = await getTheSportsDbEnrichment();
  const sportsDbEvents = [...sportsDb.seasonEvents, ...sportsDb.nextEvents, ...sportsDb.previousEvents];
  const upcomingMatches = selectUpcomingMatches(matches);

  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-4xl font-semibold">{tournament?.name ?? "World Cup 2026"}</h1>
          <p className="mt-3 text-white/75">{matches.length} matches loaded from PostgreSQL.</p>
          <nav className="mt-6 flex flex-wrap gap-3 text-sm">
            {["matches", "groups", "third-place", "bracket", "teams"].map((route) => (
              <Link key={route} className="rounded bg-white/10 px-3 py-2 hover:bg-white/20" href={`/${route}`}>{route}</Link>
            ))}
          </nav>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <FeaturedMatchWidget match={upcomingMatches[0]} events={sportsDbEvents} />
          <div className="mt-4">
            <ApiSportsWidget type="live" title="Live matches" fallback={<p className="text-sm text-black/60">Live widget not available.</p>} />
          </div>
          <div className="mt-6">
            <NextMatchesWidget matches={upcomingMatches} events={sportsDbEvents} title="Upcoming matches" />
          </div>
          <div className="mt-8">
            <TeamShowcaseWidget teams={teams.slice(0, 4)} sportsDbTeams={sportsDb.teams} />
          </div>
        </div>
        <div className="space-y-6">
          <RecentResultsWidget matches={matches} events={sportsDbEvents} />
          <section>
            <h2 className="text-2xl font-semibold">Group Leaders</h2>
            <div className="mt-4 space-y-2">
              {tables.map((table) => (
                <div key={table.groupName} className="rounded-md border bg-white p-3 text-sm">
                  <span className="font-medium">{table.groupName}</span>: {table.rows[0]?.teamName ?? "Not available"}
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-semibold">Third-place Cut Line</h2>
            <div className="mt-4 space-y-2">
              {ranking.slice(0, 8).map((row) => (
                <div key={row.teamId} className="rounded-md border bg-white p-3 text-sm">#{row.rank} {row.teamName} - {row.points} pts - {row.qualificationStatus === "PROVISIONAL" ? "Provisional" : "Pending"}</div>
              ))}
              {ranking.length === 0 ? <div className="rounded-md border bg-white p-3 text-sm text-black/60">Third-place ranking will appear after group matches are played.</div> : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
