import { DevelopmentNotice } from "@/components/development-notice";
import { getTeams } from "@/lib/data/world-cup";
import { notAvailable } from "@/lib/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Teams | World Cup 2026" };

export default async function TeamsPage() {
  const { tournament, teams } = await getTeams();
  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-semibold">Teams</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          {teams.map((team) => (
            <article key={team.id} className="rounded-md border bg-white p-4">
              <Link className="font-semibold underline-offset-4 hover:underline" href={`/teams/${team.id}`}>{team.name}</Link>
              <p className="mt-1 text-sm text-black/60">{notAvailable(team.groupEntries[0]?.group.name)}</p>
              <p className="mt-3 text-sm">FIFA code: {notAvailable(team.fifaCode)}</p>
            </article>
          ))}
        </div>
        {teams.length === 0 ? <p className="mt-6">Not available</p> : null}
      </section>
    </main>
  );
}
