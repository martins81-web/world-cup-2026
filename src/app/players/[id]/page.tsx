import { notFound } from "next/navigation";
import Image from "next/image";
import { DevelopmentNotice } from "@/components/development-notice";
import { ApiSportsWidget } from "@/components/api-sports-widget";
import { getPlayerById } from "@/lib/data/world-cup";
import { notAvailable } from "@/lib/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { player } = await getPlayerById(id);
  return { title: `${player?.name ?? "Player"} | World Cup 2026` };
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tournament, player } = await getPlayerById(id);
  if (!player) notFound();
  const stats = player.statistics[0];
  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-3xl font-semibold">{player.name}</h1>
        <div className="mt-5">
          <ApiSportsWidget type="player" player={player.apiFootballId} title="API-Sports player widget" fallback={<p className="text-sm text-black/60">Widget not available. Custom player profile is shown below.</p>} />
        </div>
        <Image className="mt-4 h-28 w-28 rounded object-cover" src={player.photoUrl ?? "/fallback-player.svg"} alt="" width={112} height={112} />
        <p className="mt-2 text-black/60">{notAvailable(player.position)} · {notAvailable(player.squads[0]?.team.name)}</p>
        <dl className="mt-8 grid gap-3 rounded-md border bg-white p-5 md:grid-cols-3">
          <div><dt className="font-medium">Shirt</dt><dd>{notAvailable(player.squads[0]?.shirtNumber)}</dd></div>
          <div><dt className="font-medium">Age</dt><dd>{notAvailable(player.age)}</dd></div>
          <div><dt className="font-medium">Height</dt><dd>{notAvailable(player.height)}</dd></div>
          <div><dt className="font-medium">Foot</dt><dd>{notAvailable(player.preferredFoot)}</dd></div>
          <div><dt className="font-medium">Club</dt><dd>{notAvailable(player.club)}</dd></div>
          <div><dt className="font-medium">Appearances</dt><dd>{notAvailable(stats?.appearances)}</dd></div>
          <div><dt className="font-medium">Minutes</dt><dd>{notAvailable(stats?.minutes)}</dd></div>
          <div><dt className="font-medium">Goals</dt><dd>{notAvailable(stats?.goals)}</dd></div>
          <div><dt className="font-medium">Assists</dt><dd>{notAvailable(stats?.assists)}</dd></div>
          <div><dt className="font-medium">Cards</dt><dd>{notAvailable(stats?.yellowCards)} / {notAvailable(stats?.redCards)}</dd></div>
        </dl>
      </section>
    </main>
  );
}
