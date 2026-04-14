import type {
  PlayerSearchResponse,
  PlayerSummary,
  PlayerStatsSummary,
  CareerStatCategory,
  HeroInfo,
  HeroDetail,
  HeroGlobalStat,
  MapInfo,
  GamemodeInfo,
  GameMode,
} from '../types/models';

const BASE_URL = 'https://overfast-api.tekrop.fr';

export class ApiError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    switch (response.status) {
      case 404:
        throw new ApiError('playerNotFound', 'Player not found', 404);
      case 422:
        throw new ApiError('profilePrivate', 'Player profile is private', 422);
      case 429:
        throw new ApiError('rateLimited', 'Rate limited. Please try again later.', 429);
      default:
        throw new ApiError('serverError', `Server error (${response.status})`, response.status);
    }
  }

  return response.json();
}

export async function searchPlayers(name: string): Promise<PlayerSearchResponse> {
  return fetchApi(`/players?name=${encodeURIComponent(name)}&limit=20`);
}

export async function getPlayerSummary(playerId: string): Promise<PlayerSummary> {
  return fetchApi(`/players/${encodeURIComponent(playerId)}/summary`);
}

export async function getPlayerStatsSummary(
  playerId: string,
  gamemode: GameMode = 'competitive'
): Promise<PlayerStatsSummary> {
  return fetchApi(`/players/${encodeURIComponent(playerId)}/stats/summary?gamemode=${gamemode}`);
}

export async function getPlayerCareerStats(
  playerId: string,
  gamemode: GameMode = 'competitive'
): Promise<Record<string, CareerStatCategory[]>> {
  return fetchApi(`/players/${encodeURIComponent(playerId)}/stats/career?gamemode=${gamemode}`);
}

export async function getHeroes(): Promise<HeroInfo[]> {
  return fetchApi('/heroes');
}

export async function getHeroDetail(heroKey: string): Promise<HeroDetail> {
  return fetchApi(`/heroes/${encodeURIComponent(heroKey)}`);
}

export async function getHeroGlobalStats(
  platform: string = 'pc',
  gamemode: GameMode = 'competitive'
): Promise<HeroGlobalStat[]> {
  return fetchApi(`/heroes/stats?platform=${platform}&gamemode=${gamemode}`);
}

export async function getMaps(): Promise<MapInfo[]> {
  return fetchApi('/maps');
}

export async function getGamemodes(): Promise<GamemodeInfo[]> {
  return fetchApi('/gamemodes');
}
