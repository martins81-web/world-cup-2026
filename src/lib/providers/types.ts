import type { MatchStatus, ProviderName } from "@prisma/client";

export type ProviderTeam = {
  provider: ProviderName;
  providerId: string;
  name: string;
  country: string;
  fifaCode?: string;
  badgeUrl?: string;
};

export type ProviderGroup = {
  name: string;
  teamProviderIds: string[];
};

export type ProviderStadium = {
  providerId: string;
  name: string;
  fifaName?: string;
  city: string;
  country: string;
  capacity?: number;
  region?: string;
};

export type ProviderMatch = {
  provider: ProviderName;
  providerId: string;
  matchNumber?: number;
  stage: string;
  stageOrder?: number;
  knockoutRound?: string;
  groupName?: string;
  kickoffAt: Date;
  venue?: string;
  city?: string;
  status: MatchStatus;
  homeTeam?: ProviderTeam;
  awayTeam?: ProviderTeam;
  homeSeed?: string;
  awaySeed?: string;
  homeScore?: number;
  awayScore?: number;
  extraTimeHome?: number;
  extraTimeAway?: number;
  penaltyHome?: number;
  penaltyAway?: number;
  stadiumProviderId?: string;
  timeElapsed?: string;
};

export type ProviderPlayer = {
  provider: ProviderName;
  providerId: string;
  name: string;
  photoUrl?: string;
  age?: number;
  height?: string;
  preferredFoot?: string;
  position?: string;
  club?: string;
  nationality?: string;
  shirtNumber?: number;
  teamProviderId?: string;
  appearances?: number;
  minutes?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  raw?: unknown;
};

export type ProviderSquad = {
  provider: ProviderName;
  teamProviderId: string;
  players: ProviderPlayer[];
};

export type ProviderLineup = {
  matchProviderId: string;
  teamProviderId: string;
  playerProviderId?: string;
  playerName?: string;
  role?: string;
  position?: string;
  shirtNumber?: number;
  raw?: unknown;
};

export type ProviderEvent = {
  matchProviderId: string;
  providerEventId?: string;
  teamProviderId?: string;
  playerProviderId?: string;
  playerName?: string;
  minute?: number;
  extraMinute?: number;
  type: string;
  detail?: string;
  comments?: string;
  raw?: unknown;
};

export type ProviderMatchStatistic = {
  matchProviderId: string;
  teamProviderId: string;
  type: string;
  value?: string;
  raw?: unknown;
};

export type ProviderTeamStatistic = {
  teamProviderId: string;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  raw?: unknown;
};

export type ProviderDataset = {
  dataset: string;
  scopeId: string;
  recordCount: number;
  payload: unknown;
  fetchedAt?: Date;
};

export interface FootballProvider {
  readonly name: ProviderName;
  readonly source?: string;
  readonly errors?: string[];
  isConfigured(): boolean;
  getWorldCupTeams(): Promise<ProviderTeam[]>;
  getWorldCupMatches(): Promise<ProviderMatch[]>;
  getWorldCupGroups?(): Promise<ProviderGroup[]>;
  getWorldCupStadiums?(): Promise<ProviderStadium[]>;
  getWorldCupSquads?(): Promise<ProviderSquad[]>;
  getWorldCupPlayers?(): Promise<ProviderPlayer[]>;
  getWorldCupLineups?(): Promise<ProviderLineup[]>;
  getWorldCupEvents?(): Promise<ProviderEvent[]>;
  getWorldCupMatchStatistics?(): Promise<ProviderMatchStatistic[]>;
  getWorldCupTeamStatistics?(): Promise<ProviderTeamStatistic[]>;
  getWorldCupDatasets?(): Promise<ProviderDataset[]>;
  syncEnrichmentOnly?(): Promise<{
    status: "skipped" | "success" | "partial" | "failed";
    message: string;
    teamsSeen: number;
    matchesSeen: number;
    groupsSeen?: number;
    stadiumsSeen?: number;
    source?: string;
    errors?: string[];
  }>;
}
