import { DevelopmentNotice } from "@/components/development-notice";
import { ApiSportsStandingsWidget } from "@/components/widgets/api-sports-standings-widget";
import { getGroupsWithTables } from "@/lib/data/world-cup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Groups | World Cup 2026" };

export default async function GroupsPage() {
  const { tournament, tables } = await getGroupsWithTables();
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
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tables.map((group) => (
            <article key={group.groupName} className="rounded-md border bg-white p-4">
              <h2 className="font-semibold">{group.groupName}</h2>
              <table className="mt-3 w-full text-sm">
                <thead className="text-left text-black/60"><tr><th>Team</th><th>P</th><th>GD</th><th className="bg-gold/20 text-right">Pts</th></tr></thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.teamId} className="border-t">
                      <td className="py-2">{row.teamName}</td>
                      <td>{row.played}</td>
                      <td>{row.goalDifference}</td>
                      <td className="bg-gold/20 text-right font-semibold">{row.points}</td>
                    </tr>
                  ))}
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
