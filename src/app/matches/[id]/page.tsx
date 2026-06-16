import { notFound } from "next/navigation";
import { ApiSportsWidget } from "@/components/api-sports-widget";
import { DevelopmentNotice } from "@/components/development-notice";
import { LocalDateTime } from "@/components/local-date-time";
import { FeaturedMatchWidget } from "@/components/widgets/featured-match-widget";
import { getMatchById, getTournament } from "@/lib/data/world-cup";
import { getTheSportsDbEnrichment } from "@/lib/providers/thesportsdb";
import { notAvailable, scoreLine } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tournament, match] = await Promise.all([getTournament(), getMatchById(id)]);
  if (!match) notFound();
  const sportsDb = await getTheSportsDbEnrichment();
  const sportsDbEvents = [...sportsDb.seasonEvents, ...sportsDb.nextEvents, ...sportsDb.previousEvents];

  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-3xl font-semibold">Match {notAvailable(match.matchNumber)}</h1>
        <div className="mt-5">
          <ApiSportsWidget type="game" fixture={match.providerId} title="API-Sports match widget" fallback={<p className="text-sm text-black/60">Widget not available. Custom match details are shown below.</p>} />
        </div>
        <div className="mt-6">
          <FeaturedMatchWidget match={match} events={sportsDbEvents} title="TheSportsDB artwork" />
        </div>
        <p className="mt-2 text-black/60">{match.stage} {match.groupName ? `- ${match.groupName}` : ""}</p>
        <div className="mt-8 rounded-md border bg-white p-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-lg">
            <div>{match.homeTeam?.name ?? match.homeSeed ?? "Not available"}</div>
            <div className="font-semibold">{scoreLine(match.homeScore, match.awayScore)}</div>
            <div className="text-right">{match.awayTeam?.name ?? match.awaySeed ?? "Not available"}</div>
          </div>
          <dl className="mt-6 grid gap-3 text-sm md:grid-cols-2">
            <div><dt className="font-medium">Kickoff</dt><dd><LocalDateTime value={match.kickoffAt} /></dd></div>
            <div><dt className="font-medium">Status</dt><dd>{match.status}</dd></div>
            <div><dt className="font-medium">Venue</dt><dd>{notAvailable(match.venue)}</dd></div>
            <div><dt className="font-medium">City</dt><dd>{notAvailable(match.city)}</dd></div>
            <div><dt className="font-medium">Extra time</dt><dd>{scoreLine(match.extraTimeHome, match.extraTimeAway)}</dd></div>
            <div><dt className="font-medium">Penalties</dt><dd>{scoreLine(match.penaltyHome, match.penaltyAway)}</dd></div>
          </dl>
        </div>
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Lineups</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {match.lineups.map((lineup) => (
              <div key={lineup.id} className="rounded-md border bg-white p-3 text-sm">
                {lineup.team.name} - {lineup.player?.name ?? "Not available"} - {lineup.role ?? "Not available"} - {lineup.position ?? "Not available"}
              </div>
            ))}
          </div>
          {match.lineups.length === 0 ? <p className="mt-3">Not available</p> : null}
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Events</h2>
          <div className="mt-3 space-y-2">
            {match.events.map((event) => (
              <div key={event.id} className="rounded-md border bg-white p-3 text-sm">
                {notAvailable(event.minute)}' - {event.type} - {event.player?.name ?? "Not available"} - {event.detail ?? "Not available"}
              </div>
            ))}
          </div>
          {match.events.length === 0 ? <p className="mt-3">Not available</p> : null}
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Statistics</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {match.statistics.map((statistic) => (
              <div key={statistic.id} className="rounded-md border bg-white p-3 text-sm">
                {statistic.team.name} - {statistic.type}: {statistic.value ?? "Not available"}
              </div>
            ))}
          </div>
          {match.statistics.length === 0 ? <p className="mt-3">Not available</p> : null}
        </section>
      </section>
    </main>
  );
}
