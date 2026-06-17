ALTER TABLE "Match" ADD COLUMN "sportsDbEventId" TEXT;
ALTER TABLE "Match" ADD COLUMN "artworkUrl" TEXT;
ALTER TABLE "Match" ADD COLUMN "thumbnailUrl" TEXT;
ALTER TABLE "Match" ADD COLUMN "bannerUrl" TEXT;
ALTER TABLE "Match" ADD COLUMN "posterUrl" TEXT;
ALTER TABLE "Match" ADD COLUMN "fanartUrl" TEXT;

CREATE UNIQUE INDEX "Match_sportsDbEventId_key" ON "Match"("sportsDbEventId");
