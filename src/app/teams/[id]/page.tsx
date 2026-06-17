import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { DevelopmentNotice } from "@/components/development-notice";
import { ApiSportsTeamWidget } from "@/components/widgets/api-sports-team-widget";
import { TeamShowcaseWidget } from "@/components/widgets/team-showcase-widget";
import { getTeamById } from "@/lib/data/world-cup";
import { getTheSportsDbEnrichment } from "@/lib/providers/thesportsdb";
import { notAvailable } from "@/lib/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { team } = await getTeamById(id);
  return { title: `${team?.name ?? "Team"} | World Cup 2026` };
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tournament, team } = await getTeamById(id);
  if (!team) notFound();
  const sportsDb = await getTheSportsDbEnrichment();
  const stats = team.statistics[0];

  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-3xl font-semibold">{team.name}</h1>
        <div className="mt-5">
          <h2 className="text-2xl font-semibold">Live widgets powered by API-Sports</h2>
          <div className="mt-4">
            <ApiSportsTeamWidget team={team.apiFootballId} />
          </div>
        </div>
        <div className="mt-6">
          <TeamShowcaseWidget teams={[team]} sportsDbTeams={sportsDb.teams} title="TheSportsDB artwork" />
        </div>
        <Image className="mt-4 h-24 w-24 rounded object-contain" src={team.badgeUrl ?? "/fallback-team.svg"} alt="" width={96} height={96} />
        <p className="mt-2 text-black/60">{notAvailable(team.groupEntries[0]?.group.name)}</p>
        <div className="mt-6 flex gap-3">
          <Link className="rounded bg-ink px-4 py-2 text-white" href={`/teams/${team.id}/squad`}>Squad</Link>
          <Link className="rounded border px-4 py-2" href="/statistics">Statistics</Link>
        </div>
        <dl className="mt-8 grid gap-3 rounded-md border bg-white p-5 md:grid-cols-3">
          <div><dt className="font-medium">FIFA code</dt><dd>{notAvailable(team.fifaCode)}</dd></div>
          <div><dt className="font-medium">Played</dt><dd>{notAvailable(stats?.played)}</dd></div>
          <div><dt className="font-medium">Goals for</dt><dd>{notAvailable(stats?.goalsFor)}</dd></div>
        </dl>
      </section>
    </main>
  );
}
