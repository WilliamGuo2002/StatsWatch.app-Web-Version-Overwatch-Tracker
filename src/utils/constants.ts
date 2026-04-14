export const HERO_ROLES: Record<string, string> = {
  'dva': 'tank', 'doomfist': 'tank', 'hazard': 'tank', 'junker-queen': 'tank',
  'mauga': 'tank', 'orisa': 'tank', 'ramattra': 'tank', 'reinhardt': 'tank',
  'roadhog': 'tank', 'sigma': 'tank', 'winston': 'tank', 'wrecking-ball': 'tank',
  'zarya': 'tank',
  'ashe': 'damage', 'bastion': 'damage', 'cassidy': 'damage', 'echo': 'damage',
  'genji': 'damage', 'hanzo': 'damage', 'junkrat': 'damage', 'mei': 'damage',
  'pharah': 'damage', 'reaper': 'damage', 'sojourn': 'damage', 'soldier-76': 'damage',
  'sombra': 'damage', 'symmetra': 'damage', 'torbjorn': 'damage', 'tracer': 'damage',
  'venture': 'damage', 'widowmaker': 'damage',
  'ana': 'support', 'baptiste': 'support', 'brigitte': 'support', 'illari': 'support',
  'juno': 'support', 'kiriko': 'support', 'lifeweaver': 'support', 'lucio': 'support',
  'mercy': 'support', 'moira': 'support', 'zenyatta': 'support',
};

export function getHeroRole(heroKey: string): string {
  return HERO_ROLES[heroKey] || 'damage';
}

export const ROLE_COLORS: Record<string, string> = {
  tank: '#3b82f6',
  damage: '#ef4444',
  support: '#22c55e',
  open: '#a855f7',
};

export const ROLE_ORDER = ['tank', 'damage', 'support', 'open'];

export const RANK_ORDER = [
  'bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster', 'ultimate',
];

// Rank estimation benchmarks per role (per-10 values)
export const RANK_BENCHMARKS: Record<string, Record<string, { elims: number; deaths: number; damage: number; healing: number }>> = {
  tank: {
    bronze: { elims: 15, deaths: 10, damage: 6000, healing: 0 },
    silver: { elims: 18, deaths: 9, damage: 7000, healing: 0 },
    gold: { elims: 21, deaths: 8.5, damage: 8000, healing: 0 },
    platinum: { elims: 24, deaths: 8, damage: 9000, healing: 0 },
    diamond: { elims: 27, deaths: 7.5, damage: 10500, healing: 0 },
    master: { elims: 30, deaths: 7, damage: 12000, healing: 0 },
    grandmaster: { elims: 33, deaths: 6, damage: 14000, healing: 0 },
  },
  damage: {
    bronze: { elims: 18, deaths: 9, damage: 7000, healing: 0 },
    silver: { elims: 21, deaths: 8.5, damage: 8500, healing: 0 },
    gold: { elims: 24, deaths: 8, damage: 10000, healing: 0 },
    platinum: { elims: 27, deaths: 7.5, damage: 11500, healing: 0 },
    diamond: { elims: 30, deaths: 7, damage: 13000, healing: 0 },
    master: { elims: 33, deaths: 6.5, damage: 15000, healing: 0 },
    grandmaster: { elims: 36, deaths: 6, damage: 17000, healing: 0 },
  },
  support: {
    bronze: { elims: 12, deaths: 9, damage: 3000, healing: 7000 },
    silver: { elims: 14, deaths: 8.5, damage: 3500, healing: 8000 },
    gold: { elims: 16, deaths: 8, damage: 4000, healing: 9000 },
    platinum: { elims: 18, deaths: 7.5, damage: 4500, healing: 10000 },
    diamond: { elims: 20, deaths: 7, damage: 5000, healing: 11500 },
    master: { elims: 22, deaths: 6.5, damage: 5500, healing: 13000 },
    grandmaster: { elims: 24, deaths: 6, damage: 6000, healing: 15000 },
  },
};

// Radar chart medians per role
export const RADAR_MEDIANS: Record<string, number[]> = {
  all: [22, 10, 0.5, 8000, 4000],
  tank: [25, 8, 0.5, 9000, 500],
  damage: [25, 10, 0.5, 10000, 500],
  support: [15, 12, 0.5, 4000, 9000],
};

// Radar chart max values for normalization per role
export const RADAR_MAX: Record<string, number[]> = {
  all: [40, 20, 1, 18000, 15000],
  tank: [40, 16, 1, 18000, 3000],
  damage: [40, 20, 1, 20000, 3000],
  support: [30, 20, 1, 10000, 18000],
};
