import type { Match, Team } from "@prisma/client";
import { LocalDateTime } from "@/components/local-date-time";
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

  return (
    <section className="overflow-hidden rounded-md border bg-white" data-testid="featured-match-widget">
      {imageUrl ? <img className="h-40 w-full object-cover" src={imageUrl} alt="" loading="lazy" /> : null}
      <div className="p-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-black/60">{match.stage}{match.groupName ? ` - ${match.groupName}` : ""}</p>
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-sm">
          <div className="min-w-0 font-medium">{match.homeTeam?.name ?? match.homeSeed ?? "Not available"}</div>
          <div className="rounded bg-black/5 px-2 py-1 font-semibold">{scoreLine(match.homeScore, match.awayScore)}</div>
          <div className="min-w-0 text-right font-medium">{match.awayTeam?.name ?? match.awaySeed ?? "Not available"}</div>
        </div>
        <div className="mt-4 text-sm text-black/60">
          <LocalDateTime value={match.kickoffAt} /> - {notAvailable(match.venue)}
        </div>
      </div>
    </section>
  );
}
