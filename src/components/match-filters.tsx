export function MatchFilters({ defaults }: { defaults: Record<string, string | undefined> }) {
  return (
    <form className="grid gap-3 rounded-md border border-black/10 bg-white p-4 md:grid-cols-6" action="/matches">
      <input className="rounded border border-black/20 px-3 py-2" name="team" placeholder="Team" defaultValue={defaults.team} />
      <input className="rounded border border-black/20 px-3 py-2" name="group" placeholder="Group A" defaultValue={defaults.group} />
      <input className="rounded border border-black/20 px-3 py-2" name="stage" placeholder="Stage" defaultValue={defaults.stage} />
      <input className="rounded border border-black/20 px-3 py-2" name="date" type="date" defaultValue={defaults.date} />
      <select className="rounded border border-black/20 px-3 py-2" name="status" defaultValue={defaults.status ?? ""}>
        <option value="">Any status</option>
        <option value="SCHEDULED">Scheduled</option>
        <option value="LIVE">Live</option>
        <option value="FINISHED">Finished</option>
        <option value="POSTPONED">Postponed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <button className="rounded bg-ink px-4 py-2 font-medium text-white" type="submit">Filter</button>
    </form>
  );
}
