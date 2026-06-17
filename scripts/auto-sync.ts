import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { ProviderName } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ApiFootballProvider } from "@/lib/providers/api-football";
import { WorldCup2026OpenSourceProvider } from "@/lib/providers/worldcup2026";
import { isWithinMontrealResultSyncWindow, montrealSyncWindowLabel } from "@/lib/sync/schedule";
import { synchronizeProvider } from "@/lib/sync/synchronization-service";

const intervalMs = Number(process.env.WORLDCUP2026_AUTO_SYNC_INTERVAL_MS ?? 60 * 1000);
let syncInProgress = false;
const execFileAsync = promisify(execFile);
const endpointFiles = [
  ["teams", "hosted.teams.json"],
  ["groups", "hosted.groups.json"],
  ["games", "hosted.games.json"],
  ["stadiums", "hosted.stadiums.json"]
] as const;

async function fetchEndpoint(endpoint: string) {
  const url = `${process.env.WORLDCUP2026_API_BASE_URL ?? "https://worldcup26.ir"}/get/${endpoint}`;
  if (process.platform === "win32") {
    const command = [
      "-NoProfile",
      "-Command",
      `$ProgressPreference='SilentlyContinue'; (Invoke-WebRequest -UseBasicParsing '${url}' -TimeoutSec 12).Content`
    ];
    const { stdout } = await execFileAsync("powershell.exe", command, { timeout: 18_000, maxBuffer: 2 * 1024 * 1024 });
    return stdout;
  }

  const { stdout } = await execFileAsync("curl", ["-L", "--silent", "--show-error", "--max-time", "12", "--fail", url], {
    timeout: 18_000,
    maxBuffer: 2 * 1024 * 1024
  });
  return stdout;
}

async function refreshHostedCache() {
  const dataDir = path.join(process.cwd(), "data", "worldcup2026");
  await fs.mkdir(dataDir, { recursive: true });

  for (const [endpoint, fileName] of endpointFiles) {
    try {
      const body = await fetchEndpoint(endpoint);
      JSON.parse(body);
      await fs.writeFile(path.join(dataDir, fileName), body);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown refresh error";
      console.warn(`[${new Date().toISOString()}] keeping cached ${fileName}; refresh failed: ${message}`);
    }
  }
}

async function runOnce() {
  if (syncInProgress) {
    console.log(`[${new Date().toISOString()}] automatic sync skipped because the previous run is still in progress`);
    return;
  }

  syncInProgress = true;
  try {
    if (!isWithinMontrealResultSyncWindow()) {
      console.log(`[${new Date().toISOString()}] automatic sync skipped outside ${montrealSyncWindowLabel()}`);
      return;
    }

    if (process.env.WORLDCUP2026_API_ENABLED === "true") {
      await refreshHostedCache();
    }
    const result = await synchronizeProvider(new WorldCup2026OpenSourceProvider());
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${result.provider} ${result.status}: ${result.matchesSeen} matches via ${result.source ?? "provider"}`);
    if (result.errors?.length) console.log(`[${timestamp}] sync warnings: ${result.errors.join(" | ")}`);

    if (process.env.API_FOOTBALL_KEY) {
      await prisma.externalApiCache.deleteMany({
        where: { provider: ProviderName.API_FOOTBALL, cacheKey: `fixtures:2026` }
      });
      const apiFootballResult = await synchronizeProvider(new ApiFootballProvider({ includeDetails: false }));
      const apiFootballTimestamp = new Date().toISOString();
      console.log(`[${apiFootballTimestamp}] ${apiFootballResult.provider} ${apiFootballResult.status}: ${apiFootballResult.matchesSeen} lightweight fixtures`);
      if (apiFootballResult.errors?.length) console.log(`[${apiFootballTimestamp}] API-Football sync warnings: ${apiFootballResult.errors.join(" | ")}`);
    }
  } finally {
    syncInProgress = false;
  }
}

async function main() {
  await runOnce();
  setInterval(() => {
    runOnce().catch((error) => {
      console.error(`[${new Date().toISOString()}] automatic sync failed`, error);
    });
  }, intervalMs);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
