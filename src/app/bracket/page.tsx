import { DevelopmentNotice } from "@/components/development-notice";
import { MatchCard } from "@/components/match-card";
import { getBracket } from "@/lib/data/world-cup";
import { getTheSportsDbEnrichment, getTheSportsDbEventsForMatches } from "@/lib/providers/thesportsdb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bracket | World Cup 2026" };

export default async function BracketPage() {
  const { tournament, rounds } = await getBracket();
  const sportsDb = await getTheSportsDbEnrichment();
  const roundNames = Object.keys(rounds);
  const bracketMatches = roundNames.flatMap((round) => rounds[round]);
  const sportsDbEvents = await getTheSportsDbEventsForMatches(
    bracketMatches,
    [...sportsDb.seasonEvents, ...sportsDb.nextEvents, ...sportsDb.previousEvents]
  );
  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="px-6 py-8">
        <h1 className="text-3xl font-semibold">Bracket</h1>
        <div className="mt-6 max-w-full overflow-x-auto pb-4">
          <div className="grid min-w-[1280px] auto-cols-[240px] grid-flow-col gap-4">
          {roundNames.map((round) => (
            <section key={round} className="w-60 rounded-md border border-black/10 bg-black/[0.02] p-3">
              <h2 className="sticky top-0 mb-3 bg-[#f6f7f2] py-2 font-semibold">{round}</h2>
              <div className="flex min-h-full flex-col justify-around gap-4">
                {rounds[round].map((match) => <MatchCard key={match.id} match={match} events={sportsDbEvents} compact />)}
              </div>
            </section>
          ))}
          </div>
        </div>
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Bracket Table</h2>
          <table className="mt-3 w-full rounded-md border bg-white text-sm">
            <caption className="sr-only">Accessible knockout bracket alternative</caption>
            <thead className="bg-black/5 text-left"><tr><th className="p-3">Round</th><th>Match</th><th>Home</th><th>Away</th></tr></thead>
            <tbody>
              {roundNames.flatMap((round) => rounds[round].map((match) => (
                <tr className="border-t" key={match.id}>
                  <td className="p-3">{round}</td><td>{match.matchNumber ?? "Not available"}</td><td>{match.homeTeam?.name ?? match.homeSeed ?? "Not available"}</td><td>{match.awayTeam?.name ?? match.awaySeed ?? "Not available"}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </section>
        {roundNames.length === 0 ? <p className="mt-6">Not available</p> : null}
      </section>
    </main>
  );
}
