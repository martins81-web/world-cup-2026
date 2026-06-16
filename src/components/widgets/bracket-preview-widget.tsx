import Link from "next/link";
import type { Match, Team } from "@prisma/client";

type BracketMatch = Match & { homeTeam?: Team | null; awayTeam?: Team | null };

export function BracketPreviewWidget({ matches, title = "Bracket preview" }: { matches: BracketMatch[]; title?: string }) {
  const previewMatches = matches.slice(0, 4);

  return (
    <section data-testid="bracket-preview-widget">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link className="shrink-0 text-sm font-medium text-ink underline-offset-4 hover:underline" href="/bracket">Open bracket</Link>
      </div>
      <div className="mt-4 space-y-3">
        {previewMatches.map((match) => (
          <article key={match.id} className="rounded-md border bg-white p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">Match {match.matchNumber ?? "TBD"}</span>
              <span className="shrink-0 rounded bg-black/5 px-2 py-1 text-xs">{match.stage}</span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 flex-1 break-words">{match.homeTeam?.name ?? match.homeSeed ?? "TBD"}</span>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 flex-1 break-words">{match.awayTeam?.name ?? match.awaySeed ?? "TBD"}</span>
              </div>
            </div>
          </article>
        ))}
        {previewMatches.length === 0 ? <p className="rounded-md border bg-white p-4 text-sm text-black/60">Bracket matches will appear when knockout fixtures are available.</p> : null}
      </div>
    </section>
  );
}
