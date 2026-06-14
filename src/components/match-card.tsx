import Link from "next/link";
import type { Match, Team } from "@prisma/client";
import { LocalDateTime } from "@/components/local-date-time";
import { notAvailable, scoreLine } from "@/lib/ui";

type MatchWithTeams = Match & { homeTeam?: Team | null; awayTeam?: Team | null };

export function MatchCard({ match }: { match: MatchWithTeams }) {
  return (
    <article className="rounded-md border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link className="font-semibold text-ink underline-offset-4 hover:underline" href={`/matches/${match.id}`}>
            Match {notAvailable(match.matchNumber)}
          </Link>
          <div className="mt-1 text-sm text-black/60">{match.stage} {match.groupName ? `· ${match.groupName}` : ""}</div>
        </div>
        <span className="rounded bg-black/5 px-2 py-1 text-xs font-medium">{match.status}</span>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
        <div>{match.homeTeam?.name ?? match.homeSeed ?? "Not available"}</div>
        <div className="font-semibold">{scoreLine(match.homeScore, match.awayScore)}</div>
        <div className="text-right">{match.awayTeam?.name ?? match.awaySeed ?? "Not available"}</div>
      </div>
      {(match.extraTimeHome !== null && match.extraTimeHome !== undefined) || (match.penaltyHome !== null && match.penaltyHome !== undefined) ? (
        <div className="mt-2 text-xs text-black/60">
          ET {scoreLine(match.extraTimeHome, match.extraTimeAway)} · Pens {scoreLine(match.penaltyHome, match.penaltyAway)}
        </div>
      ) : null}
      <div className="mt-4 text-sm text-black/60">
        <LocalDateTime value={match.kickoffAt} /> · {notAvailable(match.venue)} · {notAvailable(match.city)}
      </div>
    </article>
  );
}
