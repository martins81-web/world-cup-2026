import type { Team } from "@prisma/client";

type ArtworkTeam = Pick<Team, "name" | "badgeUrl"> | null | undefined;

export function MatchArtwork({
  imageUrl,
  homeTeam,
  awayTeam,
  homeLabel,
  awayLabel,
  className = ""
}: {
  imageUrl?: string;
  homeTeam?: ArtworkTeam;
  awayTeam?: ArtworkTeam;
  homeLabel?: string | null;
  awayLabel?: string | null;
  className?: string;
}) {
  if (imageUrl) {
    return <img className={className || "h-24 w-full rounded object-cover"} src={imageUrl} alt="" loading="lazy" />;
  }

  const homeName = homeTeam?.name ?? homeLabel ?? "TBD";
  const awayName = awayTeam?.name ?? awayLabel ?? "TBD";
  const homeBadge = homeTeam?.badgeUrl ?? "/fallback-team.svg";
  const awayBadge = awayTeam?.badgeUrl ?? "/fallback-team.svg";

  return (
    <div className={`overflow-hidden rounded bg-ink text-white ${className || "h-24 w-full"}`} aria-label={`${homeName} versus ${awayName}`}>
      <div className="flex h-full min-w-0 items-center gap-3 bg-[linear-gradient(135deg,#10231f_0%,#10231f_48%,#f15f79_48%,#f15f79_67%,#21b7c6_67%,#21b7c6_100%)] p-3">
        <img className="h-10 w-10 shrink-0 rounded-full bg-white object-contain p-1" src={homeBadge} alt="" loading="lazy" />
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-xs font-semibold uppercase tracking-normal">{homeName}</div>
          <div className="my-1 text-[10px] font-bold text-white/80">vs</div>
          <div className="truncate text-xs font-semibold uppercase tracking-normal">{awayName}</div>
        </div>
        <img className="h-10 w-10 shrink-0 rounded-full bg-white object-contain p-1" src={awayBadge} alt="" loading="lazy" />
      </div>
    </div>
  );
}
