CREATE TABLE "ApiFootballDataset" (
    "id" TEXT NOT NULL,
    "dataset" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiFootballDataset_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SyncRun" ADD COLUMN "datasetsSeen" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "ApiFootballDataset_dataset_scopeId_key" ON "ApiFootballDataset"("dataset", "scopeId");
CREATE INDEX "ApiFootballDataset_dataset_idx" ON "ApiFootballDataset"("dataset");
CREATE INDEX "ApiFootballDataset_fetchedAt_idx" ON "ApiFootballDataset"("fetchedAt");
