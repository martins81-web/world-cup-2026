import { PrismaClient } from "@prisma/client";
import {
  findSportsDbEvent,
  getTheSportsDbEnrichment,
  getTheSportsDbEventsForMatches,
  sportsDbImageUrl
} from "@/lib/providers/thesportsdb";

const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    where: {
      tournament: { slug: "world-cup-2026" },
      homeTeamId: { not: null },
      awayTeamId: { not: null }
    },
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ matchNumber: "asc" }, { kickoffAt: "asc" }]
  });

  const enrichment = await getTheSportsDbEnrichment();
  const events = await getTheSportsDbEventsForMatches(
    matches,
    [...enrichment.seasonEvents, ...enrichment.nextEvents, ...enrichment.previousEvents]
  );

  let updated = 0;
  let matched = 0;
  const missing: string[] = [];

  for (const match of matches) {
    const event = findSportsDbEvent(match, events);
    const artworkUrl = event ? sportsDbImageUrl(event.strThumb, event.strBanner, event.strPoster, event.strFanart) : undefined;

    if (!event || !artworkUrl) {
      missing.push(`${match.matchNumber ?? match.id}: ${match.homeTeam?.name ?? "TBD"} vs ${match.awayTeam?.name ?? "TBD"}`);
      continue;
    }

    matched += 1;

    const data = {
      sportsDbEventId: match.sportsDbEventId ?? event.idEvent,
      artworkUrl: match.artworkUrl ?? artworkUrl,
      thumbnailUrl: match.thumbnailUrl ?? event.strThumb ?? null,
      bannerUrl: match.bannerUrl ?? event.strBanner ?? null,
      posterUrl: match.posterUrl ?? event.strPoster ?? null,
      fanartUrl: match.fanartUrl ?? event.strFanart ?? null
    };

    const needsUpdate =
      data.sportsDbEventId !== match.sportsDbEventId ||
      data.artworkUrl !== match.artworkUrl ||
      data.thumbnailUrl !== match.thumbnailUrl ||
      data.bannerUrl !== match.bannerUrl ||
      data.posterUrl !== match.posterUrl ||
      data.fanartUrl !== match.fanartUrl;

    if (!needsUpdate) continue;

    await prisma.match.update({
      where: { id: match.id },
      data
    });
    updated += 1;
  }

  console.log(JSON.stringify({
    matchesChecked: matches.length,
    matched,
    updated,
    missingArtwork: missing.length,
    missing: missing.slice(0, 20)
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
