import Link from "next/link";
import Image from "next/image";
import type { Player, PlayerStatistic, SquadMembership } from "@prisma/client";
import { notAvailable } from "@/lib/ui";

type CardPlayer = SquadMembership & { player: Player & { statistics: PlayerStatistic[] } };

export function PlayerCard({ member }: { member: CardPlayer }) {
  const stats = member.player.statistics[0];
  return (
    <article className="rounded-md border bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <Image className="h-20 w-20 rounded object-cover" src={member.player.photoUrl ?? "/fallback-player.svg"} alt="" width={80} height={80} />
        <div>
          <Link className="font-semibold underline-offset-4 hover:underline" href={`/players/${member.player.id}`}>{member.player.name}</Link>
          <p className="text-sm text-black/60">#{notAvailable(member.shirtNumber)} · {notAvailable(member.position ?? member.player.position)}</p>
          <p className="mt-1 text-sm">Club: {notAvailable(member.player.club)}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div><dt className="text-black/60">Age</dt><dd>{notAvailable(member.player.age)}</dd></div>
        <div><dt className="text-black/60">Height</dt><dd>{notAvailable(member.player.height)}</dd></div>
        <div><dt className="text-black/60">Foot</dt><dd>{notAvailable(member.player.preferredFoot)}</dd></div>
        <div><dt className="text-black/60">Apps</dt><dd>{notAvailable(stats?.appearances)}</dd></div>
        <div><dt className="text-black/60">Minutes</dt><dd>{notAvailable(stats?.minutes)}</dd></div>
        <div><dt className="text-black/60">Goals</dt><dd>{notAvailable(stats?.goals)}</dd></div>
        <div><dt className="text-black/60">Assists</dt><dd>{notAvailable(stats?.assists)}</dd></div>
        <div><dt className="text-black/60">Cards</dt><dd>{notAvailable(stats?.yellowCards)} / {notAvailable(stats?.redCards)}</dd></div>
      </dl>
    </article>
  );
}
