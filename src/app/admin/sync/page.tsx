import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-auth";
import { SyncButton } from "@/components/admin/sync-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Sync | World Cup 2026"
};

export default async function AdminSyncPage() {
  await requireAdminPage();
  const runs = await prisma.syncRun.findMany({ orderBy: { startedAt: "desc" }, take: 10 });
  const lastSuccessfulRuns = await prisma.syncRun.findMany({
    where: { status: { in: ["success", "partial"] } },
    orderBy: { finishedAt: "desc" },
    distinct: ["provider"],
    take: 10
  });
  const quota = await prisma.apiQuotaUsage.findMany({ orderBy: { day: "desc" }, take: 10 });
  const lastSuccessByProvider = new Map(lastSuccessfulRuns.map((run) => [run.provider, run.finishedAt?.toISOString() ?? "Not available"]));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Admin Synchronization</h1>
      <p className="mt-2 text-black/70">Enter the server-side admin token to trigger a provider sync.</p>
      <div className="mt-6">
        <SyncButton />
      </div>
      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Recent sync runs</h2>
          <div className="mt-3 space-y-2">
            {runs.map((run) => (
              <div key={run.id} className="rounded-md border bg-white p-3 text-sm">
                <div className="font-medium">{run.provider} - {run.status}</div>
                <div className="text-black/60">
                  {run.startedAt.toISOString()} - source {run.source ?? "provider"} - teams {run.teamsSeen} - groups {run.groupsSeen} - matches {run.matchesSeen} - stadiums {run.stadiumsSeen}
                </div>
                <div className="text-black/60">Last successful sync: {lastSuccessByProvider.get(run.provider) ?? "Not available"}</div>
                {run.message ? <div className="text-red-700">{run.message}</div> : null}
                {run.errors ? <pre className="mt-2 max-h-28 overflow-auto rounded bg-black/5 p-2 text-xs">{JSON.stringify(run.errors, null, 2)}</pre> : null}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Quota usage</h2>
          <div className="mt-3 space-y-2">
            {quota.map((entry) => (
              <div key={entry.id} className="rounded-md border bg-white p-3 text-sm">
                <div className="font-medium">{entry.provider}</div>
                <div className="text-black/60">{entry.day.toISOString().slice(0, 10)} - {entry.requests}/{entry.limit ?? "unlimited"}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
