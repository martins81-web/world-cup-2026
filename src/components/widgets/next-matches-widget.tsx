import type { Match, Team } from "@prisma/client";
import { LocalDateTime } from "@/components/local-date-time";
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
          return (
            <article key={match.id} className="grid gap-4 rounded-md border bg-white p-4 sm:grid-cols-[96px_minmax(0,1fr)]">
              {imageUrl ? <img className="h-24 w-full rounded object-cover sm:w-24" src={imageUrl} alt="" loading="lazy" /> : null}
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold">Match {notAvailable(match.matchNumber)}</h3>
                  <span className="rounded bg-black/5 px-2 py-1 text-xs font-medium">{match.status}</span>
                </div>
                <p className="mt-1 text-sm text-black/60">{match.stage}{match.groupName ? ` - ${match.groupName}` : ""}</p>
                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-sm">
                  <div className="min-w-0">{match.homeTeam?.name ?? match.homeSeed ?? "Not available"}</div>
                  <div className="font-semibold">{scoreLine(match.homeScore, match.awayScore)}</div>
                  <div className="min-w-0 text-right">{match.awayTeam?.name ?? match.awaySeed ?? "Not available"}</div>
                </div>
                <p className="mt-3 text-sm text-black/60"><LocalDateTime value={match.kickoffAt} /> - {notAvailable(match.venue)}</p>
              </div>
            </article>
          );
        })}
        {matches.length === 0 ? <p className="rounded-md border bg-white p-4 text-sm text-black/60">No upcoming matches are available yet.</p> : null}
      </div>
    </section>
  );
}
