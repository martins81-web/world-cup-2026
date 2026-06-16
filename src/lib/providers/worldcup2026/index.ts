import { execFile } from "node:child_process";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { promisify } from "node:util";
import { MatchStatus, ProviderName } from "@prisma/client";
import { z } from "zod";
import { env } from "@/lib/env";
import type { FootballProvider, ProviderGroup, ProviderMatch, ProviderStadium, ProviderTeam } from "@/lib/providers/types";
import teamsJson from "../../../../data/worldcup2026/football.teams.json";
import matchesJson from "../../../../data/worldcup2026/football.matches.json";
import matchTablesJson from "../../../../data/worldcup2026/football.matchtables.json";
import stadiumsJson from "../../../../data/worldcup2026/football.stadiums.json";

const teamSchema = z.object({
  id: z.string(),
  name_en: z.string(),
  flag: z.string().url().optional(),
  fifa_code: z.string(),
  groups: z.string()
});

const matchSchema = z.object({
  id: z.string(),
  home_team_id: z.string(),
  away_team_id: z.string(),
  home_score: z.string(),
  away_score: z.string(),
  group: z.string(),
  matchday: z.string(),
  local_date: z.string(),
  stadium_id: z.string(),
  finished: z.string(),
  time_elapsed: z.string(),
  type: z.string(),
  home_team_label: z.string().optional(),
  away_team_label: z.string().optional()
});

const groupSchema = z.object({
  group: z.string().optional(),
  name: z.string().optional(),
  teams: z.array(z.object({ team_id: z.string() }))
});

const stadiumSchema = z.object({
  id: z.string(),
  name_en: z.string(),
  fifa_name: z.string().optional(),
  city_en: z.string(),
  country_en: z.string(),
  capacity: z.number().optional(),
  region: z.string().optional()
});

const teamArraySchema = z.array(teamSchema);
const matchArraySchema = z.array(matchSchema);
const groupArraySchema = z.array(groupSchema);
const stadiumArraySchema = z.array(stadiumSchema);
const execFileAsync = promisify(execFile);

export type WorldCup2026Dataset = {
  teams: ProviderTeam[];
  groups: ProviderGroup[];
  matches: ProviderMatch[];
  stadiums: ProviderStadium[];
};

function parseLocalDate(value: string) {
  const [date, time] = value.split(" ");
  const [month, day, year] = date.split("/");
  return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${time}:00Z`);
}

function matchStatus(match: z.infer<typeof matchSchema>) {
  if (match.finished.toUpperCase() === "TRUE") return MatchStatus.FINISHED;
  if (!["notstarted", "pending"].includes(match.time_elapsed.toLowerCase())) return MatchStatus.LIVE;
  return MatchStatus.SCHEDULED;
}

function stageFor(type: string) {
  const stages: Record<string, { stage: string; order: number; round?: string }> = {
    group: { stage: "Group Stage", order: 1 },
    r32: { stage: "Round of 32", order: 2, round: "R32" },
    r16: { stage: "Round of 16", order: 3, round: "R16" },
    qf: { stage: "Quarter-finals", order: 4, round: "QF" },
    sf: { stage: "Semi-finals", order: 5, round: "SF" },
    third: { stage: "Third-place play-off", order: 6, round: "3P" },
    final: { stage: "Final", order: 7, round: "F" }
  };
  return stages[type.toLowerCase()] ?? { stage: type, order: 0 };
}

function score(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function unwrapHostedArray(input: unknown, key: string) {
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object" && key in input) return (input as Record<string, unknown>)[key];
  return input;
}

function groupName(group: string) {
  return /^[A-L]$/.test(group) ? `Group ${group}` : undefined;
}

export function parseWorldCup2026Dataset(input: {
  teams: unknown;
  matches: unknown;
  groups: unknown;
  stadiums: unknown;
}): WorldCup2026Dataset {
  const teams = teamArraySchema.parse(unwrapHostedArray(input.teams, "teams")).map((team) => ({
    provider: ProviderName.WORLDCUP2026_OPEN_SOURCE,
    providerId: team.id,
    name: team.name_en,
    country: team.name_en,
    fifaCode: team.fifa_code,
    badgeUrl: team.flag
  }));

  const matches = matchArraySchema.parse(unwrapHostedArray(input.matches, "games")).map((match) => {
    const stage = stageFor(match.type);
    const hasResult = match.finished.toUpperCase() === "TRUE" || !["notstarted", "pending"].includes(match.time_elapsed.toLowerCase());
    return {
      provider: ProviderName.WORLDCUP2026_OPEN_SOURCE,
      providerId: match.id,
      matchNumber: Number(match.id),
      stage: stage.stage,
      stageOrder: stage.order,
      knockoutRound: stage.round,
      groupName: groupName(match.group),
      kickoffAt: parseLocalDate(match.local_date),
      status: matchStatus(match),
      homeTeam: match.home_team_id === "0" ? undefined : teams.find((team) => team.providerId === match.home_team_id),
      awayTeam: match.away_team_id === "0" ? undefined : teams.find((team) => team.providerId === match.away_team_id),
      homeSeed: match.home_team_id === "0" ? match.home_team_label : undefined,
      awaySeed: match.away_team_id === "0" ? match.away_team_label : undefined,
      homeScore: hasResult ? score(match.home_score) : undefined,
      awayScore: hasResult ? score(match.away_score) : undefined,
      stadiumProviderId: match.stadium_id,
      timeElapsed: match.time_elapsed
    };
  });

  return {
    teams,
    matches,
    groups: groupArraySchema.parse(unwrapHostedArray(input.groups, "groups")).map((group) => ({
      name: `Group ${group.group ?? group.name}`,
      teamProviderIds: group.teams.map((team) => team.team_id)
    })),
    stadiums: stadiumArraySchema.parse(unwrapHostedArray(input.stadiums, "stadiums")).map((stadium) => ({
      providerId: stadium.id,
      name: stadium.name_en,
      fifaName: stadium.fifa_name,
      city: stadium.city_en,
      country: stadium.country_en,
      capacity: stadium.capacity,
      region: stadium.region
    }))
  };
}

export function loadLocalWorldCup2026Dataset() {
  return parseWorldCup2026Dataset({
    teams: teamsJson,
    matches: matchesJson,
    groups: matchTablesJson,
    stadiums: stadiumsJson
  });
}

export function loadHostedWorldCup2026Cache() {
  const dataDir = path.join(process.cwd(), "data", "worldcup2026");
  const readJson = (fileName: string) => JSON.parse(fs.readFileSync(path.join(dataDir, fileName), "utf8"));

  return parseWorldCup2026Dataset({
    teams: readJson("hosted.teams.json"),
    matches: readJson("hosted.games.json"),
    groups: readJson("hosted.groups.json"),
    stadiums: readJson("hosted.stadiums.json")
  });
}

async function fetchJsonWithRetry(url: string, token: string, errors: string[]) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        signal: controller.signal
      });
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Hosted API returned HTTP ${response.status}; token may be missing or unauthorized.`);
      }
      if (!response.ok) throw new Error(`Hosted API returned HTTP ${response.status}.`);
      return await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown hosted API error";
      if (attempt === 3) {
        const fallback = await fetchJsonWithNodeHttpsFallback(url, token)
          .catch(() => fetchJsonWithCurlFallback(url, token))
          .catch((fallbackError: unknown) => {
            const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : "Unknown fallback error";
            errors.push(`${url}: ${message}; fallback: ${fallbackMessage}`);
            return null;
          });
        if (fallback) return fallback;
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

async function fetchJsonWithCurlFallback(url: string, token: string) {
  const args = ["-L", "--silent", "--show-error", "--max-time", "15", "--fail"];
  if (token) args.push("-H", `Authorization: Bearer ${token}`);
  args.push(url);

  const { stdout } = await execFileAsync(process.platform === "win32" ? "curl.exe" : "curl", args, {
    timeout: 20_000,
    maxBuffer: 2 * 1024 * 1024
  });
  return JSON.parse(stdout);
}

function fetchJsonWithNodeHttpsFallback(url: string, token: string) {
  return new Promise<unknown>((resolve, reject) => {
    const request = https.request(url, {
      method: "GET",
      timeout: 5_000,
      rejectUnauthorized: false,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        if (response.statusCode === 401 || response.statusCode === 403) {
          reject(new Error(`Hosted API returned HTTP ${response.statusCode}; token may be missing or unauthorized.`));
          return;
        }
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Hosted API returned HTTP ${response.statusCode ?? "unknown"}.`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error("Hosted API returned invalid JSON."));
        }
      });
    });
    request.on("timeout", () => {
      request.destroy(new Error("Hosted API request timed out."));
    });
    request.on("error", reject);
    request.end();
  });
}

export class WorldCup2026OpenSourceProvider implements FootballProvider {
  readonly name = ProviderName.WORLDCUP2026_OPEN_SOURCE;
  source = "local dataset";
  errors: string[] = [];
  private dataset?: WorldCup2026Dataset;

  isConfigured() {
    return true;
  }

  private async getDataset() {
    if (this.dataset) return this.dataset;
    const local = loadLocalWorldCup2026Dataset();
    this.dataset = local;

    if (!env.WORLDCUP2026_API_ENABLED) return this.dataset;

    const baseUrl = env.WORLDCUP2026_API_BASE_URL.replace(/\/$/, "");
    const teams = await fetchJsonWithRetry(`${baseUrl}/get/teams`, env.WORLDCUP2026_API_TOKEN, this.errors);
    const groups = await fetchJsonWithRetry(`${baseUrl}/get/groups`, env.WORLDCUP2026_API_TOKEN, this.errors);
    const matches = await fetchJsonWithRetry(`${baseUrl}/get/games`, env.WORLDCUP2026_API_TOKEN, this.errors);
    const stadiums = await fetchJsonWithRetry(`${baseUrl}/get/stadiums`, env.WORLDCUP2026_API_TOKEN, this.errors);

    if (teams && groups && matches && stadiums) {
      try {
        const hosted = parseWorldCup2026Dataset({ teams, groups, matches, stadiums });
        if (hosted.teams.length > 0 && hosted.matches.length > 0) {
          this.source = "hosted API";
          this.dataset = hosted;
        }
      } catch (error) {
        this.errors.push(error instanceof Error ? error.message : "Hosted API payload could not be parsed.");
      }
    }

    if (this.source !== "hosted API") {
      try {
        const hostedCache = loadHostedWorldCup2026Cache();
        if (hostedCache.teams.length > 0 && hostedCache.matches.length > 0) {
          this.source = "hosted API cache";
          this.dataset = hostedCache;
        }
      } catch (error) {
        this.errors.push(error instanceof Error ? error.message : "Hosted API cache could not be parsed.");
      }
    }

    if (!["hosted API", "hosted API cache"].includes(this.source) && this.errors.length > 0) this.source = "local dataset fallback";
    return this.dataset;
  }

  async getWorldCupTeams() {
    return (await this.getDataset()).teams;
  }

  async getWorldCupGroups() {
    return (await this.getDataset()).groups;
  }

  async getWorldCupMatches() {
    return (await this.getDataset()).matches;
  }

  async getWorldCupStadiums() {
    return (await this.getDataset()).stadiums;
  }
}
