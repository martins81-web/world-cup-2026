import Link from "next/link";
import type { Match, Team } from "@prisma/client";
import { LocalDateTime } from "@/components/local-date-time";
import { matchStatisticsHref } from "@/components/match-card";
import { MatchArtwork } from "@/components/widgets/match-artwork";
import { findSportsDbEvent, sportsDbImageUrl, type SportsDbEvent } from "@/lib/providers/thesportsdb";
import { notAvailable, scoreLine } from "@/lib/ui";

type MatchWithTeams = Match & { homeTeam?: Team | null; awayTeam?: Team | null };

export function NextMatchesWidget({ matches, events = [], title = "Next matches" }: { matches: MatchWithTeams[]; events?: SportsDbEvent[]; title?: string }) {
  return (
    <section data-testid="next-matches-widget">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-4">
        {matches.map((match) => {
          const event = findSportsDbEvent(match, events);
          const imageUrl = sportsDbImageUrl(event?.strThumb, event?.strBanner);
          const href = matchStatisticsHref(match);
          return (
            <article key={match.id} className="grid max-w-full gap-4 overflow-hidden rounded-md border bg-white p-4 sm:grid-cols-[128px_minmax(0,1fr)]">
              <MatchArtwork
                imageUrl={imageUrl}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                homeLabel={match.homeSeed}
                awayLabel={match.awaySeed}
                className="h-24 w-full rounded object-cover sm:h-24 sm:w-32"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold">Match {notAvailable(match.matchNumber)}</h3>
                  <span className="rounded bg-black/5 px-2 py-1 text-xs font-medium">{match.status}</span>
                </div>
                <p className="mt-1 text-sm text-black/60">{match.stage}{match.groupName ? ` - ${match.groupName}` : ""}</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 flex-1 break-words whitespace-normal">{match.homeTeam?.name ?? match.homeSeed ?? "Not available"}</span>
                    <span className="shrink-0 rounded bg-black/5 px-2 py-1 text-xs font-semibold">{scoreLine(match.homeScore, match.awayScore)}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 flex-1 break-words whitespace-normal">{match.awayTeam?.name ?? match.awaySeed ?? "Not available"}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-black/60"><LocalDateTime value={match.kickoffAt} /> - {notAvailable(match.venue)}</p>
                <Link className="mt-4 inline-flex rounded bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-black" href={href}>
                  View statistics
                </Link>
              </div>
            </article>
          );
        })}
        {matches.length === 0 ? <p className="rounded-md border bg-white p-4 text-sm text-black/60">No upcoming matches are available yet.</p> : null}
      </div>
    </section>
  );
}
