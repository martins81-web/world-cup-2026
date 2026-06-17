import { notFound } from "next/navigation";
import { DevelopmentNotice } from "@/components/development-notice";
import { LocalDateTime } from "@/components/local-date-time";
import { ApiSportsGameWidget } from "@/components/widgets/api-sports-game-widget";
import { FeaturedMatchWidget } from "@/components/widgets/featured-match-widget";
import { LocalMatchCentreWidget } from "@/components/widgets/local-match-centre-widget";
import { getMatchById, getTournament } from "@/lib/data/world-cup";
import { findSportsDbEvent, getTheSportsDbEnrichment, getTheSportsDbEventsForMatches, TheSportsDbProvider } from "@/lib/providers/thesportsdb";
import { notAvailable, scoreLine } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tournament, match] = await Promise.all([getTournament(), getMatchById(id)]);
  if (!match) notFound();
  const sportsDb = await getTheSportsDbEnrichment();
  const sportsDbEvents = await getTheSportsDbEventsForMatches(
    [match],
    [...sportsDb.seasonEvents, ...sportsDb.nextEvents, ...sportsDb.previousEvents]
  );
  const sportsDbEvent = findSportsDbEvent(match, sportsDbEvents);
  const sportsDbStatistics = sportsDbEvent
    ? await new TheSportsDbProvider().getEventStatistics(sportsDbEvent.idEvent)
    : [];
  const localStatistics = getLocalMatchStatistics(match);

  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-3xl font-semibold">Match {notAvailable(match.matchNumber)}</h1>
        <div className="mt-5">
          {match.apiFootballFixtureId ? (
            <>
              <h2 className="text-2xl font-semibold">Live widgets powered by API-Sports</h2>
              <div className="mt-4">
                <ApiSportsGameWidget fixture={match.apiFootballFixtureId} title="API-Sports fixture statistics" />
              </div>
            </>
          ) : (
            <LocalMatchCentreWidget match={match} />
          )}
        </div>
        <div className="mt-6">
          <FeaturedMatchWidget match={match} events={sportsDbEvents} title="TheSportsDB artwork" />
        </div>
        <p className="mt-2 text-black/60">{match.stage} {match.groupName ? `- ${match.groupName}` : ""}</p>
        <div className="mt-8 rounded-md border bg-white p-6">
          <div className="space-y-3 text-lg">
            <div className="flex min-w-0 items-center gap-3">
              <span className="min-w-0 flex-1 break-words">{match.homeTeam?.name ?? match.homeSeed ?? "Not available"}</span>
              <span className="shrink-0 rounded bg-black/5 px-3 py-1 font-semibold">{scoreLine(match.homeScore, match.awayScore)}</span>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <span className="min-w-0 flex-1 break-words">{match.awayTeam?.name ?? match.awaySeed ?? "Not available"}</span>
            </div>
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
        <section id="lineups" className="mt-8 scroll-mt-24">
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
        <section id="events" className="mt-8 scroll-mt-24">
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
        <section id="statistics" className="mt-8 scroll-mt-24">
          <h2 className="text-xl font-semibold">Statistics</h2>
          {sportsDbEvent ? (
            <p className="mt-2 text-sm text-black/60">TheSportsDB event ID {sportsDbEvent.idEvent}</p>
          ) : null}
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {localStatistics.map((statistic) => (
              <div key={statistic.label} className="rounded-md border bg-white p-3 text-sm">
                <div className="text-black/60">{statistic.label}</div>
                <div className="mt-1 font-semibold">{statistic.value}</div>
              </div>
            ))}
            {match.statistics.map((statistic) => (
              <div key={statistic.id} className="rounded-md border bg-white p-3 text-sm">
                {statistic.team.name} - {statistic.type}: {statistic.value ?? "Not available"}
              </div>
            ))}
          </div>
          <div className="mt-6 overflow-x-auto rounded-md border bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-black/5">
                <tr>
                  <th className="px-3 py-2 font-semibold">Provider stat</th>
                  <th className="px-3 py-2 font-semibold">{match.homeTeam?.name ?? match.homeSeed ?? "Home"}</th>
                  <th className="px-3 py-2 font-semibold">{match.awayTeam?.name ?? match.awaySeed ?? "Away"}</th>
                </tr>
              </thead>
              <tbody>
                {sportsDbStatistics.map((statistic, index) => (
                  <tr key={statistic.idStatistic ?? `${statistic.strStat}-${index}`} className="border-t">
                    <td className="px-3 py-2">{notAvailable(statistic.strStat)}</td>
                    <td className="px-3 py-2 font-medium">{notAvailable(statistic.intHome)}</td>
                    <td className="px-3 py-2 font-medium">{notAvailable(statistic.intAway)}</td>
                  </tr>
                ))}
                {sportsDbStatistics.length === 0 ? (
                  <tr className="border-t">
                    <td className="px-3 py-3 text-black/60" colSpan={3}>
                      TheSportsDB event statistics are not available for this match yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function getLocalMatchStatistics(match: NonNullable<Awaited<ReturnType<typeof getMatchById>>>) {
  const result = match.status === "FINISHED"
    ? getResultLabel(match.homeTeam?.name ?? match.homeSeed, match.awayTeam?.name ?? match.awaySeed, match.homeScore, match.awayScore)
    : "Pending";

  return [
    { label: "Result", value: result },
    { label: "Score", value: scoreLine(match.homeScore, match.awayScore) },
    { label: "Stage", value: match.groupName ? `${match.stage} - ${match.groupName}` : match.stage },
    { label: "Status", value: match.status },
    { label: "Kickoff", value: match.kickoffAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) },
    { label: "Venue", value: [match.venue, match.city].filter(Boolean).join(" - ") || "Not available" },
    { label: "Extra time", value: scoreLine(match.extraTimeHome, match.extraTimeAway) },
    { label: "Penalties", value: scoreLine(match.penaltyHome, match.penaltyAway) }
  ];
}

function getResultLabel(homeName?: string | null, awayName?: string | null, homeScore?: number | null, awayScore?: number | null) {
  if (homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined) return "Pending";
  if (homeScore > awayScore) return `${homeName ?? "Home"} win`;
  if (awayScore > homeScore) return `${awayName ?? "Away"} win`;
  return "Draw";
}
