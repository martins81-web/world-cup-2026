import Link from "next/link";
import { ApiSportsWidget } from "@/components/api-sports-widget";
import { DevelopmentNotice } from "@/components/development-notice";
import { MatchCard } from "@/components/match-card";
import { getGroupsWithTables, getMatches, getThirdPlaceRanking, getTournament } from "@/lib/data/world-cup";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tournament = await getTournament();
  const matches = await getMatches();
  const { tables } = await getGroupsWithTables();
  const { ranking } = await getThirdPlaceRanking();

  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-4xl font-semibold">{tournament?.name ?? "World Cup 2026"}</h1>
          <p className="mt-3 text-white/75">{matches.length} matches loaded from PostgreSQL.</p>
          <nav className="mt-6 flex flex-wrap gap-3 text-sm">
            {["matches", "groups", "third-place", "bracket", "teams"].map((route) => (
              <Link key={route} className="rounded bg-white/10 px-3 py-2 hover:bg-white/20" href={`/${route}`}>{route}</Link>
            ))}
          </nav>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="text-2xl font-semibold">Upcoming Matches</h2>
          <div className="mt-4">
            <ApiSportsWidget type="live" title="Live matches" fallback={<p className="text-sm text-black/60">Live widget not available.</p>} />
          </div>
          <div className="mt-4 grid gap-4">
            {matches.slice(0, 6).map((match) => <MatchCard key={match.id} match={match} />)}
            {matches.length === 0 ? <p>Not available</p> : null}
          </div>
        </div>
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold">Group Leaders</h2>
            <div className="mt-4 space-y-2">
              {tables.map((table) => (
                <div key={table.groupName} className="rounded-md border bg-white p-3 text-sm">
                  <span className="font-medium">{table.groupName}</span>: {table.rows[0]?.teamName ?? "Not available"}
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-semibold">Third-place Cut Line</h2>
            <div className="mt-4 space-y-2">
              {ranking.slice(0, 8).map((row) => (
                <div key={row.teamId} className="rounded-md border bg-white p-3 text-sm">#{row.rank} {row.teamName} · {row.points} pts · Qualified</div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
