import { DevelopmentNotice } from "@/components/development-notice";
import { ApiSportsStandingsWidget } from "@/components/widgets/api-sports-standings-widget";
import { getGroupsWithTables, getThirdPlaceRanking } from "@/lib/data/world-cup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Groups | World Cup 2026" };

export default async function GroupsPage() {
  const { tournament, tables } = await getGroupsWithTables();
  const { ranking } = await getThirdPlaceRanking();
  const provisionalThirdPlaceTeamIds = new Set(ranking.filter((row) => row.qualified).map((row) => row.teamId));
  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-semibold">Groups</h1>
        <div className="mt-5">
          <h2 className="text-2xl font-semibold">Live widgets powered by API-Sports</h2>
          <div className="mt-4">
            <ApiSportsStandingsWidget />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3 text-xs text-black/65">
          <span className="inline-flex items-center gap-2 rounded bg-white px-3 py-2 shadow-sm ring-1 ring-black/10"><span className="h-3 w-3 rounded-full bg-emerald-500" />Top two</span>
          <span className="inline-flex items-center gap-2 rounded bg-white px-3 py-2 shadow-sm ring-1 ring-black/10"><span className="h-3 w-3 rounded-full bg-sky-500" />Best third-place range</span>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tables.map((group) => (
            <article key={group.groupName} className="overflow-hidden rounded-md border border-black/10 bg-white shadow-sm">
              <div className="border-b border-black/10 bg-ink px-4 py-3 text-white">
                <h2 className="font-semibold">{group.groupName}</h2>
              </div>
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col />
                  <col className="w-9" />
                  <col className="w-11" />
                  <col className="w-12" />
                </colgroup>
                <thead className="bg-black/[0.03] text-left text-xs uppercase text-black/55">
                  <tr>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-1 py-3 text-center">P</th>
                    <th className="px-1 py-3 text-center">GD</th>
                    <th className="bg-gold/20 px-2 py-3 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row, index) => {
                    const isTopTwo = index < 2;
                    const isProvisionalThirdPlace = index === 2 && provisionalThirdPlaceTeamIds.has(row.teamId);
                    const rowClass = isTopTwo ? "bg-emerald-50/70" : isProvisionalThirdPlace ? "bg-sky-50/80" : "";
                    const markerClass = isTopTwo ? "bg-emerald-500" : isProvisionalThirdPlace ? "bg-sky-500" : "bg-transparent";
                    return (
                    <tr key={row.teamId} className={`border-t border-black/10 ${rowClass}`}>
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={`h-7 w-1 shrink-0 rounded-full ${markerClass}`} />
                          <img className="h-5 w-7 shrink-0 rounded-sm border border-black/10 object-cover" src={row.badgeUrl ?? "/fallback-team.svg"} alt="" loading="lazy" />
                          <span className="min-w-0 flex-1 break-words font-medium">{cleanTeamName(row.teamName)}</span>
                        </div>
                      </td>
                      <td className="px-1 py-3 text-center tabular-nums">{row.played}</td>
                      <td className="px-1 py-3 text-center tabular-nums">{row.goalDifference}</td>
                      <td className="bg-gold/20 px-2 py-3 text-right font-semibold tabular-nums">{row.points}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </article>
          ))}
        </div>
        {tables.length === 0 ? <p className="mt-6">Not available</p> : null}
      </section>
    </main>
  );
}

function cleanTeamName(name: string) {
  return name.replace(/Cura(?:çao|Ã§ao|�ao)/g, "Curaçao");
}
