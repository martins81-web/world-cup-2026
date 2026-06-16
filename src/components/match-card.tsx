import Link from "next/link";
import type { Match, Team } from "@prisma/client";
import { LocalDateTime } from "@/components/local-date-time";
import { MatchArtwork } from "@/components/widgets/match-artwork";
import { notAvailable, scoreLine } from "@/lib/ui";

type MatchWithTeams = Match & { homeTeam?: Team | null; awayTeam?: Team | null };

export function matchStatisticsHref(match: Pick<Match, "id" | "matchNumber">) {
  return `/matches/${match.matchNumber ?? match.id}#statistics`;
}

export function MatchCard({ match }: { match: MatchWithTeams }) {
  const href = matchStatisticsHref(match);

  return (
    <article className="grid max-w-full gap-4 overflow-hidden rounded-md border border-black/10 bg-white p-4 shadow-sm sm:grid-cols-[128px_minmax(0,1fr)]">
      <MatchArtwork
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        homeLabel={match.homeSeed}
        awayLabel={match.awaySeed}
        className="h-24 w-full rounded object-cover sm:h-24 sm:w-32"
      />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link className="font-semibold text-ink underline-offset-4 hover:underline" href={href}>
              Match {notAvailable(match.matchNumber)}
            </Link>
            <div className="mt-1 text-sm text-black/60">{match.stage} {match.groupName ? `- ${match.groupName}` : ""}</div>
          </div>
          <span className="shrink-0 rounded bg-black/5 px-2 py-1 text-xs font-medium">{match.status}</span>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 break-words whitespace-normal">{match.homeTeam?.name ?? match.homeSeed ?? "Not available"}</span>
            <span className="shrink-0 rounded bg-black/5 px-2 py-1 text-xs font-semibold">{scoreLine(match.homeScore, match.awayScore)}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 break-words whitespace-normal">{match.awayTeam?.name ?? match.awaySeed ?? "Not available"}</span>
          </div>
        </div>
        {(match.extraTimeHome !== null && match.extraTimeHome !== undefined) || (match.penaltyHome !== null && match.penaltyHome !== undefined) ? (
          <div className="mt-2 text-xs text-black/60">
            ET {scoreLine(match.extraTimeHome, match.extraTimeAway)} - Pens {scoreLine(match.penaltyHome, match.penaltyAway)}
          </div>
        ) : null}
        <div className="mt-4 text-sm text-black/60">
          <LocalDateTime value={match.kickoffAt} /> - {notAvailable(match.venue)} - {notAvailable(match.city)}
        </div>
        <Link className="mt-4 inline-flex rounded bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-black" href={href}>
          View statistics
        </Link>
      </div>
    </article>
  );
}
