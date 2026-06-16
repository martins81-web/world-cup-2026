import { MatchStatus, type Match, type Team } from "@prisma/client";
import { LocalDateTime } from "@/components/local-date-time";
import { findSportsDbEvent, sportsDbImageUrl, type SportsDbEvent } from "@/lib/providers/thesportsdb";
import { scoreLine } from "@/lib/ui";

type MatchWithTeams = Match & { homeTeam?: Team | null; awayTeam?: Team | null };

export function RecentResultsWidget({ matches, events = [], title = "Recent results" }: { matches: MatchWithTeams[]; events?: SportsDbEvent[]; title?: string }) {
  const finishedMatches = matches
    .filter((match) => match.status === MatchStatus.FINISHED)
    .sort((a, b) => b.kickoffAt.getTime() - a.kickoffAt.getTime())
    .slice(0, 4);

  return (
    <section data-testid="recent-results-widget">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">
        {finishedMatches.map((match) => {
          const event = findSportsDbEvent(match, events);
          const imageUrl = sportsDbImageUrl(event?.strThumb, event?.strBanner);
          return (
            <article key={match.id} className="flex min-w-0 gap-3 rounded-md border bg-white p-3 text-sm">
              {imageUrl ? <img className="h-14 w-20 flex-none rounded object-cover" src={imageUrl} alt="" loading="lazy" /> : null}
              <div className="min-w-0 flex-1">
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                  <span className="min-w-0">{match.homeTeam?.name ?? match.homeSeed ?? "Not available"}</span>
                  <span className="font-semibold">{scoreLine(match.homeScore, match.awayScore)}</span>
                  <span className="min-w-0 text-right">{match.awayTeam?.name ?? match.awaySeed ?? "Not available"}</span>
                </div>
                <p className="mt-2 text-xs text-black/60"><LocalDateTime value={match.kickoffAt} /></p>
              </div>
            </article>
          );
        })}
        {finishedMatches.length === 0 ? <p className="rounded-md border bg-white p-4 text-sm text-black/60">Recent results will appear after matches finish.</p> : null}
      </div>
    </section>
  );
}
