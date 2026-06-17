import { MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { findSportsDbEvent, getTheSportsDbEnrichment, getTheSportsDbEventsForMatches, sportsDbImageUrl } from "@/lib/providers/thesportsdb";

async function main() {
  const matches = await prisma.match.findMany({
    where: {
      tournament: { slug: "world-cup-2026" },
      stage: "Group Stage",
      status: { in: [MatchStatus.SCHEDULED, MatchStatus.LIVE, MatchStatus.FINISHED] }
    },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchNumber: "asc" }
  });

  const enrichment = await getTheSportsDbEnrichment();
  const baseEvents = [...enrichment.seasonEvents, ...enrichment.nextEvents, ...enrichment.previousEvents];
  const events = await getTheSportsDbEventsForMatches(matches, baseEvents);
  const matched = matches
    .map((match) => ({ match, event: findSportsDbEvent(match, events) }))
    .filter(({ event }) => event && sportsDbImageUrl(event.strThumb, event.strBanner, event.strPoster, event.strFanart));

  console.table({
    groupMatches: matches.length,
    cachedOrFetchedEvents: events.length,
    groupMatchesWithArtwork: matched.length,
    missingArtwork: matches.length - matched.length
  });

  const missing = matches
    .filter((match) => !findSportsDbEvent(match, events))
    .map((match) => `${match.matchNumber}: ${match.homeTeam?.name ?? match.homeSeed} vs ${match.awayTeam?.name ?? match.awaySeed}`);

  if (missing.length > 0) {
    console.log("Missing TheSportsDB artwork:");
    for (const row of missing) console.log(`- ${row}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
