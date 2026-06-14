import { DevelopmentNotice } from "@/components/development-notice";
import { getThirdPlaceRanking } from "@/lib/data/world-cup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Third-place Ranking | World Cup 2026" };

export default async function ThirdPlacePage() {
  const { tournament, ranking } = await getThirdPlaceRanking();
  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-3xl font-semibold">Third-place Ranking</h1>
        <div className="mt-6 overflow-hidden rounded-md border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left"><tr><th className="p-3">Rank</th><th>Team</th><th>GD</th><th className="bg-gold/20">Pts</th><th>Status</th></tr></thead>
            <tbody>
              {ranking.map((row) => (
                <tr key={row.teamId} className="border-t">
                  <td className="p-3">{row.rank}</td><td>{row.teamName}</td><td>{row.goalDifference}</td><td className="bg-gold/20 font-semibold">{row.points}</td><td>{row.qualified ? "Qualified" : "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ranking.length === 0 ? <p className="mt-6">Not available</p> : null}
      </section>
    </main>
  );
}
