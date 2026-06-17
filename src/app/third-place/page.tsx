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
        <div className="mt-6 overflow-hidden rounded-md border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 bg-ink px-4 py-3 text-white">
            <h2 className="font-semibold">Best third-place teams</h2>
          </div>
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-12" />
              <col className="w-20" />
              <col />
              <col className="w-12" />
              <col className="w-12" />
              <col className="w-24" />
            </colgroup>
            <thead className="bg-black/[0.03] text-left text-xs uppercase text-black/55">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-2 py-3">Group</th>
                <th className="px-2 py-3">Team</th>
                <th className="px-1 py-3 text-center">GD</th>
                <th className="bg-gold/20 px-2 py-3 text-right">Pts</th>
                <th className="px-3 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row) => (
                <tr key={row.teamId} className={`border-t border-black/10 ${row.qualified ? "bg-emerald-50/70" : ""}`}>
                  <td className="px-4 py-3 font-semibold tabular-nums">{row.rank}</td>
                  <td className="px-2 py-3 text-black/65">{row.groupName.replace("Group ", "")}</td>
                  <td className="px-2 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`h-7 w-1 shrink-0 rounded-full ${row.qualified ? "bg-emerald-500" : "bg-transparent"}`} />
                      <img className="h-5 w-7 shrink-0 rounded-sm border border-black/10 object-cover" src={row.badgeUrl ?? "/fallback-team.svg"} alt="" loading="lazy" />
                      <span className="min-w-0 flex-1 break-words font-medium">{cleanTeamName(row.teamName)}</span>
                    </div>
                  </td>
                  <td className="px-1 py-3 text-center tabular-nums">{row.goalDifference}</td>
                  <td className="bg-gold/20 px-2 py-3 text-right font-semibold tabular-nums">{row.points}</td>
                  <td className="px-3 py-3 text-right">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${row.qualified ? "bg-emerald-100 text-emerald-800" : "bg-black/5 text-black/60"}`}>
                      {row.qualificationStatus === "PROVISIONAL" ? "Provisional" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ranking.length === 0 ? <p className="mt-6 rounded-md border bg-white p-4 text-sm text-black/60">Third-place ranking will appear after group matches are played.</p> : null}
      </section>
    </main>
  );
}

function cleanTeamName(name: string) {
  return name.replace(/Cura(?:\u00e7ao|\u00c3\u00a7ao|\u00ef\u00bf\u00bdao|\?ao)/g, "Cura\u00e7ao");
}
