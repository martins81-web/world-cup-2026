import type { Team } from "@prisma/client";

type ArtworkTeam = Pick<Team, "name" | "badgeUrl"> | null | undefined;

export function MatchArtwork({
  imageUrl,
  homeTeam,
  awayTeam,
  homeLabel,
  awayLabel,
  compact = false,
  className = ""
}: {
  imageUrl?: string;
  homeTeam?: ArtworkTeam;
  awayTeam?: ArtworkTeam;
  homeLabel?: string | null;
  awayLabel?: string | null;
  compact?: boolean;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <div className={`overflow-hidden rounded bg-white ${className || "w-full"}`} aria-label={`${homeTeam?.name ?? homeLabel ?? "Home"} versus ${awayTeam?.name ?? awayLabel ?? "Away"}`}>
        <img className="h-full w-full object-contain" src={imageUrl} alt="" loading="lazy" />
      </div>
    );
  }

  const homeName = homeTeam?.name ?? homeLabel ?? "TBD";
  const awayName = awayTeam?.name ?? awayLabel ?? "TBD";
  const homeBadge = homeTeam?.badgeUrl ?? "/fallback-team.svg";
  const awayBadge = awayTeam?.badgeUrl ?? "/fallback-team.svg";
  const flagClass = compact ? "h-7 w-10" : "h-10 w-14";
  const labelClass = compact ? "max-w-16 truncate text-[7px] font-black uppercase tracking-normal" : "max-w-24 truncate text-[8px] font-black uppercase tracking-normal";
  const centreClass = compact
    ? "flex h-10 w-10 flex-col items-center justify-center rounded-full bg-white text-[8px] font-black uppercase leading-none text-[#1235ef] shadow"
    : "flex h-14 w-14 flex-col items-center justify-center rounded-full bg-white text-[9px] font-black uppercase leading-none text-[#1235ef] shadow";

  return (
    <div className={`overflow-hidden rounded bg-[#1235ef] text-white shadow-sm ${className || "h-24 w-full"}`} aria-label={`${homeName} versus ${awayName}`}>
      <div className="relative h-full min-w-0 bg-[linear-gradient(135deg,#4778ff_0%,#2348ef_44%,#12bfd0_44%,#12bfd0_69%,#ff6382_69%,#ff6382_100%)]">
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[#76ac45]/85" />
        <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/20" />
        <div className="absolute inset-x-0 top-1 text-center text-[7px] font-black uppercase tracking-normal text-white">
          World Cup 2026
        </div>
        <div className={`relative flex h-full min-w-0 items-center justify-center ${compact ? "gap-2 px-2 pt-3" : "gap-3 px-3 pt-4"}`}>
          <div className="flex min-w-0 flex-1 flex-col items-center">
            <div className={`flex ${flagClass} items-center justify-center rounded bg-white shadow`}>
              <img className="max-h-full max-w-full object-contain" src={homeBadge} alt="" loading="lazy" />
            </div>
            <div className={labelClass}>{homeName}</div>
          </div>
          <div className={centreClass}>
            <span>vs</span>
            <span className="mt-0.5 text-[7px] text-[#12bfd0]">2026</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center">
            <div className={`flex ${flagClass} items-center justify-center rounded bg-white shadow`}>
              <img className="max-h-full max-w-full object-contain" src={awayBadge} alt="" loading="lazy" />
            </div>
            <div className={labelClass}>{awayName}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
