import Link from "next/link";
import type { Match, Team } from "@prisma/client";
import { LocalDateTime } from "@/components/local-date-time";
import { matchStatisticsHref } from "@/components/match-card";
import { findSportsDbEvent, sportsDbImageUrl, type SportsDbEvent } from "@/lib/providers/thesportsdb";
import { notAvailable, scoreLine } from "@/lib/ui";

type MatchWithTeams = Match & { homeTeam?: Team | null; awayTeam?: Team | null };

export function FeaturedMatchWidget({ match, events = [], title = "Featured match" }: { match?: MatchWithTeams | null; events?: SportsDbEvent[]; title?: string }) {
  if (!match) {
    return (
      <section className="rounded-md border bg-white p-4" data-testid="featured-match-widget">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-3 text-sm text-black/60">No featured match is available yet.</p>
      </section>
    );
  }

  const event = findSportsDbEvent(match, events);
  const imageUrl = sportsDbImageUrl(event?.strThumb, event?.strBanner, event?.strPoster, event?.strFanart);
  const href = matchStatisticsHref(match);

  return (
    <section className="max-w-full overflow-hidden rounded-md border bg-white" data-testid="featured-match-widget">
      {imageUrl ? <img className="h-40 w-full object-cover" src={imageUrl} alt="" loading="lazy" /> : null}
      <div className="p-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-black/60">{match.stage}{match.groupName ? ` - ${match.groupName}` : ""}</p>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 break-words whitespace-normal font-medium">{match.homeTeam?.name ?? match.homeSeed ?? "Not available"}</span>
            <span className="shrink-0 rounded bg-black/5 px-2 py-1 font-semibold">{scoreLine(match.homeScore, match.awayScore)}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 break-words whitespace-normal font-medium">{match.awayTeam?.name ?? match.awaySeed ?? "Not available"}</span>
          </div>
        </div>
        <div className="mt-4 text-sm text-black/60">
          <LocalDateTime value={match.kickoffAt} /> - {notAvailable(match.venue)}
        </div>
        <Link className="mt-4 inline-flex rounded bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-black" href={href}>
          View statistics
        </Link>
      </div>
    </section>
  );
}
