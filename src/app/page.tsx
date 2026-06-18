import { DevelopmentNotice } from "@/components/development-notice";
import { ApiSportsCompetitionDashboard } from "@/components/widgets/api-sports-competition-dashboard";
import { FeaturedMatchWidget } from "@/components/widgets/featured-match-widget";
import { BracketPreviewWidget } from "@/components/widgets/bracket-preview-widget";
import { GroupOverviewWidget } from "@/components/widgets/group-overview-widget";
import { NextMatchesWidget } from "@/components/widgets/next-matches-widget";
import { RecentResultsWidget } from "@/components/widgets/recent-results-widget";
import { TeamShowcaseWidget } from "@/components/widgets/team-showcase-widget";
import { getBracket, getGroupsWithTables, getMatches, getTeams, getThirdPlaceRanking, getTournament } from "@/lib/data/world-cup";
import { getTheSportsDbEnrichment, getTheSportsDbEventsForMatches } from "@/lib/providers/thesportsdb";
import { getFeaturedMatch, getGroupPreview, getRecentResults, getTeamShowcase, getUpcomingMatches } from "@/lib/tournament/upcoming";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tournament = await getTournament();
  const matches = await getMatches();
  const { teams } = await getTeams();
  const { tables } = await getGroupsWithTables();
  const { ranking } = await getThirdPlaceRanking();
  const { matches: bracketMatches } = await getBracket();
  const sportsDb = await getTheSportsDbEnrichment();
  const featuredMatch = getFeaturedMatch(matches);
  const upcomingMatches = getUpcomingMatches(matches, 6);
  const recentMatches = getRecentResults(matches, 4);
  const showcaseTeams = getTeamShowcase(teams, 4);
  const previewGroups = getGroupPreview(tables, 6);
  const sportsDbEvents = await getTheSportsDbEventsForMatches(
    [featuredMatch, ...upcomingMatches, ...recentMatches, ...bracketMatches.slice(0, 4)].filter(Boolean),
    [...sportsDb.seasonEvents, ...sportsDb.nextEvents, ...sportsDb.previousEvents]
  );

  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-4xl font-semibold">{tournament?.name ?? "World Cup 2026"}</h1>
          <p className="mt-3 text-white/75">{matches.length} matches loaded from PostgreSQL.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-8">
        <ApiSportsCompetitionDashboard />
      </section>
      <section className="border-t border-black/10 bg-white/45">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-6">
            <p className="text-sm font-medium uppercase text-black/55">Stored in PostgreSQL</p>
            <h2 className="mt-1 text-2xl font-semibold">Local tournament coverage</h2>
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <FeaturedMatchWidget match={featuredMatch} events={sportsDbEvents} />
              <div className="mt-6">
                <NextMatchesWidget matches={upcomingMatches} events={sportsDbEvents} title="Upcoming matches" />
              </div>
              <div className="mt-8">
                <TeamShowcaseWidget teams={showcaseTeams} sportsDbTeams={sportsDb.teams} />
              </div>
              <div className="mt-8">
                <GroupOverviewWidget tables={previewGroups} />
              </div>
            </div>
            <div className="space-y-6">
              <RecentResultsWidget matches={recentMatches} events={sportsDbEvents} />
              <BracketPreviewWidget matches={bracketMatches} />
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
                  {ranking.map((row) => (
                    <div key={row.teamId} className="rounded-md border bg-white p-3 text-sm">#{row.rank} {row.groupName} - {row.teamName} - {row.points} pts - {row.qualificationStatus === "PROVISIONAL" ? "Provisional" : "Pending"}</div>
                  ))}
                  {ranking.length === 0 ? <div className="rounded-md border bg-white p-3 text-sm text-black/60">Third-place ranking will appear after group matches are played.</div> : null}
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
