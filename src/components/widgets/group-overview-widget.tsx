import type { GroupTable } from "@/lib/tournament/engine";

export function GroupOverviewWidget({ tables, title = "Group overview" }: { tables: GroupTable[]; title?: string }) {
  return (
    <section data-testid="group-overview-widget">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {tables.map((table) => (
          <article key={table.groupName} className="overflow-hidden rounded-md border border-black/10 bg-white text-sm shadow-sm">
            <div className="border-b border-black/10 bg-ink px-3 py-2 text-white">
              <h3 className="font-semibold">{table.groupName}</h3>
            </div>
            <div className="mt-2 space-y-2">
              {table.rows.slice(0, 2).map((row) => (
                <div key={row.teamId} className="mx-2 flex min-w-0 items-center gap-2 rounded bg-emerald-50/70 px-2 py-1">
                  <span className="h-6 w-1 shrink-0 rounded-full bg-emerald-500" />
                  <img className="h-5 w-7 shrink-0 rounded-sm border border-black/10 object-cover" src={row.badgeUrl ?? "/fallback-team.svg"} alt="" loading="lazy" />
                  <span className="min-w-0 flex-1 break-words font-medium">{cleanTeamName(row.teamName)}</span>
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

function cleanTeamName(name: string) {
  return name.replace(/Cura(?:çao|Ã§ao|�ao)/g, "Curaçao");
}
