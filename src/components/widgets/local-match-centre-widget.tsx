import type { Match, Team } from "@prisma/client";
import { LocalDateTime } from "@/components/local-date-time";
import { notAvailable, scoreLine } from "@/lib/ui";

type MatchWithTeams = Match & { homeTeam?: Team | null; awayTeam?: Team | null };

export function LocalMatchCentreWidget({ match }: { match: MatchWithTeams }) {
  const homeName = match.homeTeam?.name ?? match.homeSeed ?? "Home";
  const awayName = match.awayTeam?.name ?? match.awaySeed ?? "Away";
  const homeBadge = match.homeTeam?.badgeUrl ?? "/fallback-team.svg";
  const awayBadge = match.awayTeam?.badgeUrl ?? "/fallback-team.svg";

  return (
    <section className="overflow-hidden rounded-md border border-black/10 bg-[#24272d] text-white" aria-label="Local match centre">
      <div className="bg-[#30333a] px-4 py-2 text-xs font-semibold uppercase tracking-normal text-white/80">
        {match.stage}{match.groupName ? ` - ${match.groupName}` : ""}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4 py-5">
        <TeamBlock name={homeName} badgeUrl={homeBadge} />
        <div className="text-center">
          <div className="text-3xl font-bold leading-none">{scoreLine(match.homeScore, match.awayScore)}</div>
          <div className="mt-2 rounded bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-200">{match.status}</div>
        </div>
        <TeamBlock name={awayName} badgeUrl={awayBadge} align="right" />
      </div>
      <div className="border-y border-white/10 bg-[#1d2025] px-4 py-3 text-center text-xs text-white/70">
        <LocalDateTime value={match.kickoffAt} /> - {notAvailable(match.venue)}{match.city ? `, ${match.city}` : ""}
      </div>
      <div className="grid grid-cols-4 bg-teal-500 text-center text-[11px] font-semibold uppercase text-[#10231f]">
        {["Events", "Statistics", "Lineups", "Players"].map((label) => (
          <a key={label} className="border-r border-teal-700/30 px-2 py-2 last:border-r-0" href={`#${label.toLowerCase()}`}>
            {label}
          </a>
        ))}
      </div>
      <div id="lineups" className="bg-[#69b85f] p-3">
        <div className="relative h-44 overflow-hidden rounded border-2 border-white/80 bg-[linear-gradient(90deg,#6fc764_0_10%,#7ad36e_10%_20%,#6fc764_20%_30%,#7ad36e_30%_40%,#6fc764_40%_50%,#7ad36e_50%_60%,#6fc764_60%_70%,#7ad36e_70%_80%,#6fc764_80%_90%,#7ad36e_90%_100%)]">
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/70" />
          <div className="absolute left-[calc(50%-32px)] top-[calc(50%-32px)] h-16 w-16 rounded-full border border-white/70" />
          <div className="absolute inset-x-2 top-2 h-[calc(100%-16px)] rounded border border-white/60" />
          <TeamDots side="home" />
          <TeamDots side="away" />
        </div>
      </div>
    </section>
  );
}

function TeamBlock({ name, badgeUrl, align = "left" }: { name: string; badgeUrl: string; align?: "left" | "right" }) {
  return (
    <div className={`min-w-0 ${align === "right" ? "text-right" : ""}`}>
      <img className={`h-14 w-20 rounded object-cover ${align === "right" ? "ml-auto" : ""}`} src={badgeUrl} alt="" loading="lazy" />
      <div className="mt-2 truncate text-sm font-semibold">{name}</div>
    </div>
  );
}

function TeamDots({ side }: { side: "home" | "away" }) {
  const positions = side === "home"
    ? [["16%", "48%"], ["28%", "28%"], ["30%", "68%"], ["42%", "48%"], ["10%", "18%"], ["10%", "78%"]]
    : [["84%", "48%"], ["72%", "28%"], ["70%", "68%"], ["58%", "48%"], ["90%", "18%"], ["90%", "78%"]];

  return (
    <>
      {positions.map(([left, top], index) => (
        <span
          key={`${side}-${index}`}
          className={`absolute flex h-6 w-6 items-center justify-center rounded-full border border-white text-[10px] font-bold shadow ${side === "home" ? "bg-white text-[#24272d]" : "bg-sky-500 text-white"}`}
          style={{ left, top, transform: "translate(-50%, -50%)" }}
        >
          {index + 1}
        </span>
      ))}
    </>
  );
}
