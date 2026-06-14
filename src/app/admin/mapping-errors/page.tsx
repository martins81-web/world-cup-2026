import { requireAdminPage } from "@/lib/admin-auth";
import { getReconciliationReport } from "@/lib/reconciliation";
import { ConflictActions } from "@/components/admin/conflict-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mapping Errors | World Cup 2026" };

export default async function MappingErrorsPage() {
  await requireAdminPage();
  const report = await getReconciliationReport();
  const issues = [...report.unmatchedTeams, ...report.unmatchedPlayers, ...report.missingFixtures, ...report.invalidMappings];
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-semibold">API Mapping Errors</h1>
      <div className="mt-6 space-y-3">
        {issues.map((issue) => (
          <article className="rounded-md border bg-white p-4" key={issue.id}>
            <div className="font-semibold">{issue.issueType}</div>
            <div className="text-sm text-black/70">{issue.message}</div>
            <div className="mt-2 text-xs text-black/50">Provider ID: {issue.providerId ?? "Not available"}</div>
            <ConflictActions issueId={issue.id} />
          </article>
        ))}
        {report.conflicts.map((conflict) => (
          <article className="rounded-md border bg-white p-4" key={conflict.id}>
            <div className="font-semibold">Conflict: {conflict.entityType}.{conflict.field}</div>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <div>Local: {conflict.currentValue ?? "Not available"}</div>
              <div>Provider: {conflict.incomingValue ?? "Not available"}</div>
            </div>
            <ConflictActions conflictId={conflict.id} />
          </article>
        ))}
      </div>
      {issues.length === 0 && report.conflicts.length === 0 ? <p className="mt-6">Not available</p> : null}
    </main>
  );
}
