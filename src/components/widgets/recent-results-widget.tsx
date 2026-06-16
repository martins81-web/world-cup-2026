import Link from "next/link";
import { MatchStatus, type Match, type Team } from "@prisma/client";
import { LocalDateTime } from "@/components/local-date-time";
import { matchStatisticsHref } from "@/components/match-card";
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
          const href = matchStatisticsHref(match);
          return (
            <article key={match.id} className="flex min-w-0 gap-3 rounded-md border bg-white p-3 text-sm">
              {imageUrl ? <img className="h-14 w-20 flex-none rounded object-cover" src={imageUrl} alt="" loading="lazy" /> : null}
              <div className="min-w-0 flex-1">
                <div className="space-y-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 flex-1 break-words whitespace-normal">{match.homeTeam?.name ?? match.homeSeed ?? "Not available"}</span>
                    <span className="shrink-0 font-semibold">{scoreLine(match.homeScore, match.awayScore)}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 flex-1 break-words whitespace-normal">{match.awayTeam?.name ?? match.awaySeed ?? "Not available"}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-black/60"><LocalDateTime value={match.kickoffAt} /></p>
                <Link className="mt-3 inline-flex rounded bg-ink px-3 py-2 text-xs font-medium text-white hover:bg-black" href={href}>
                  View statistics
                </Link>
              </div>
            </article>
          );
        })}
        {finishedMatches.length === 0 ? <p className="rounded-md border bg-white p-4 text-sm text-black/60">Recent results will appear after matches finish.</p> : null}
      </div>
    </section>
  );
}
