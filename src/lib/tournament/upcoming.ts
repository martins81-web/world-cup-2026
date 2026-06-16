import { MatchStatus } from "@prisma/client";

type MatchLike = {
  status: MatchStatus | string;
  kickoffAt: Date | string;
};

const scheduledStatuses = new Set<string>([
  MatchStatus.SCHEDULED,
  "TIMED",
  "NOT_STARTED",
  "NOTSTARTED",
  "PENDING",
  "FUTURE",
  "SCHEDULED"
]);

function kickoffTime(match: MatchLike) {
  const date = match.kickoffAt instanceof Date ? match.kickoffAt : new Date(match.kickoffAt);
  const time = date.getTime();
  return Number.isFinite(time) ? time : null;
}

export function isScheduledStatus(status: MatchLike["status"]) {
  return scheduledStatuses.has(String(status).trim().toUpperCase());
}

export function selectUpcomingMatches<TMatch extends MatchLike>(matches: TMatch[], now = new Date(), limit = 6) {
  const nowTime = now.getTime();
  const scheduledMatches = matches
    .filter((match) => isScheduledStatus(match.status) && kickoffTime(match) !== null)
    .sort((a, b) => (kickoffTime(a) ?? 0) - (kickoffTime(b) ?? 0));

  const futureScheduledMatches = scheduledMatches.filter((match) => (kickoffTime(match) ?? 0) >= nowTime);
  if (futureScheduledMatches.length > 0) return futureScheduledMatches.slice(0, limit);
  if (scheduledMatches.length > 0) return scheduledMatches.slice(0, limit);

  return matches
    .filter((match) => kickoffTime(match) !== null)
    .sort((a, b) => (kickoffTime(a) ?? 0) - (kickoffTime(b) ?? 0))
    .slice(0, limit);
}
