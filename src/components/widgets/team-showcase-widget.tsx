import type { Team } from "@prisma/client";
import { findSportsDbTeam, sportsDbImageUrl, type SportsDbTeam } from "@/lib/providers/thesportsdb";
import { notAvailable } from "@/lib/ui";

type TeamWithGroup = Team & { groupEntries?: Array<{ group: { name: string } }> };

export function TeamShowcaseWidget({ teams, sportsDbTeams = [], title = "Team showcase" }: { teams: TeamWithGroup[]; sportsDbTeams?: SportsDbTeam[]; title?: string }) {
  return (
    <section data-testid="team-showcase-widget">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {teams.map((team) => {
          const sportsDbTeam = findSportsDbTeam(team, sportsDbTeams);
          const imageUrl = sportsDbImageUrl(sportsDbTeam?.strTeamBadge, sportsDbTeam?.strTeamLogo, team.badgeUrl);
          return (
            <article key={team.id} className="min-w-0 rounded-md border bg-white p-4">
              {imageUrl ? <img className="h-16 w-16 object-contain" src={imageUrl} alt="" loading="lazy" /> : null}
              <h3 className="mt-3 font-semibold">{team.name}</h3>
              <p className="mt-1 text-sm text-black/60">{notAvailable(team.groupEntries?.[0]?.group.name)}</p>
              <p className="mt-2 text-xs uppercase tracking-normal text-black/50">{notAvailable(team.fifaCode)}</p>
            </article>
          );
        })}
        {teams.length === 0 ? <p className="rounded-md border bg-white p-4 text-sm text-black/60">No teams are available yet.</p> : null}
      </div>
    </section>
  );
}
