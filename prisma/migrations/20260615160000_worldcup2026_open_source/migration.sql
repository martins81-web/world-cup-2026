ALTER TYPE "ProviderName" ADD VALUE 'WORLDCUP2026_OPEN_SOURCE';

ALTER TABLE "Team" ADD COLUMN "worldcup2026Id" TEXT;

CREATE TABLE "Stadium" (
    "id" TEXT NOT NULL,
    "worldcup2026Id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fifaName" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "capacity" INTEGER,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stadium_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Match" ADD COLUMN "stadiumId" TEXT;

ALTER TABLE "SyncRun" ADD COLUMN "groupsSeen" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SyncRun" ADD COLUMN "stadiumsSeen" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SyncRun" ADD COLUMN "source" TEXT;
ALTER TABLE "SyncRun" ADD COLUMN "errors" JSONB;

CREATE UNIQUE INDEX "Team_worldcup2026Id_key" ON "Team"("worldcup2026Id");
CREATE UNIQUE INDEX "Stadium_worldcup2026Id_key" ON "Stadium"("worldcup2026Id");
CREATE INDEX "Match_stadiumId_idx" ON "Match"("stadiumId");

ALTER TABLE "Match" ADD CONSTRAINT "Match_stadiumId_fkey" FOREIGN KEY ("stadiumId") REFERENCES "Stadium"("id") ON DELETE SET NULL ON UPDATE CASCADE;
