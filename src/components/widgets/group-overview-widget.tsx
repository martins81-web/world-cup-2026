import type { GroupTable } from "@/lib/tournament/engine";

export function GroupOverviewWidget({ tables, title = "Group overview" }: { tables: GroupTable[]; title?: string }) {
  return (
    <section data-testid="group-overview-widget">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {tables.map((table) => (
          <article key={table.groupName} className="rounded-md border bg-white p-3 text-sm">
            <h3 className="font-semibold">{table.groupName}</h3>
            <div className="mt-2 space-y-2">
              {table.rows.slice(0, 2).map((row) => (
                <div key={row.teamId} className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 flex-1 break-words">{row.teamName}</span>
                  <span className="shrink-0 rounded bg-black/5 px-2 py-1 text-xs font-medium">{row.points} pts</span>
                </div>
              ))}
            </div>
          </article>
        ))}
        {tables.length === 0 ? <p className="rounded-md border bg-white p-4 text-sm text-black/60">Groups will appear when tournament data is loaded.</p> : null}
      </div>
    </section>
  );
}
