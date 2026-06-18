import { ApiSportsCompetitionDashboard } from "@/components/widgets/api-sports-competition-dashboard";
import { ApiSportsGameWidget } from "@/components/widgets/api-sports-game-widget";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live Center | World Cup 2026" };

export default async function LiveCenterPage() {
  const match = await prisma.match.findFirst({
    where: { apiFootballFixtureId: { not: null } },
    orderBy: [{ status: "asc" }, { kickoffAt: "asc" }]
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-semibold">API-Sports Live Center</h1>
      <p className="mt-2 max-w-3xl text-black/65">
        Live competition widgets use API-Sports while PostgreSQL remains the application source of truth.
      </p>

      <div className="mt-8">
        <ApiSportsCompetitionDashboard title="Competition overview" />
      </div>

      <section className="mt-10" aria-labelledby="fixture-widget-title">
        <h2 id="fixture-widget-title" className="text-2xl font-semibold">Fixture center</h2>
        <div className="mt-5 min-w-0">
          <ApiSportsGameWidget fixture={match?.apiFootballFixtureId} title="Featured fixture center" />
        </div>
      </section>
    </main>
  );
}
