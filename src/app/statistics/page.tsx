import { DevelopmentNotice } from "@/components/development-notice";
import { StatTable } from "@/components/stat-table";
import { getStatistics } from "@/lib/data/world-cup";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Statistics | World Cup 2026"
};

export default async function StatisticsPage() {
  const { tournament, teamStatistics, playerStatistics } = await getStatistics();
  return (
    <main>
      <DevelopmentNotice active={tournament?.isSeedData} />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-semibold">Statistics</h1>
        <h2 className="mt-8 text-xl font-semibold">Teams</h2>
        <div className="mt-4"><StatTable rows={teamStatistics.map((item) => ({ Team: item.team.name, Played: item.played, Won: item.won, GF: item.goalsFor, GA: item.goalsAgainst }))} /></div>
        <h2 className="mt-8 text-xl font-semibold">Players</h2>
        <div className="mt-4"><StatTable rows={playerStatistics.map((item) => ({ Player: item.player.name, Team: item.team?.name, Apps: item.appearances, Minutes: item.minutes, Goals: item.goals, Assists: item.assists }))} /></div>
      </section>
    </main>
  );
}
