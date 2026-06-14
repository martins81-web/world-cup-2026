import { notFound } from "next/navigation";
import { DevelopmentNotice } from "@/components/development-notice";
import { ApiSportsWidget } from "@/components/api-sports-widget";
import { PlayerCard } from "@/components/player-card";
import { getTeamSquad } from "@/lib/data/world-cup";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { team } = await getTeamSquad(id);
  return { title: `${team?.name ?? "Team"} Squad | World Cup 2026` };
}

export default async function TeamSquadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tournament, team, squad } = await getTeamSquad(id);
  if (!team) notFound();
  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-semibold">{team.name} Squad</h1>
        <div className="mt-5">
          <ApiSportsWidget type="squad" team={team.apiFootballId} title="API-Sports squad widget" fallback={<p className="text-sm text-black/60">Widget not available. Custom squad cards are shown below.</p>} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {squad.map((member) => <PlayerCard key={member.id} member={member} />)}
        </div>
        {squad.length === 0 ? <p className="mt-6">Not available</p> : null}
      </section>
    </main>
  );
}
