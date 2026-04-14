import type { HeroStatEntry, PlayerStatsSummary, RoleStatEntry } from '../types/models';
import { RANK_BENCHMARKS, RADAR_MEDIANS, RADAR_MAX, getHeroRole } from './constants';

// ---- Radar Chart ----
export function getRadarData(
  stats: PlayerStatsSummary,
  role: string | null
): number[] {
  let elims = 0, assists = 0, deaths = 0, damage = 0, healing = 0;

  if (role && stats.roles?.[role]) {
    const r = stats.roles[role];
    elims = r.average.eliminations;
    assists = r.average.assists;
    deaths = r.average.deaths;
    damage = r.average.damage;
    healing = r.average.healing;
  } else if (stats.general) {
    elims = stats.general.average.eliminations;
    assists = stats.general.average.assists;
    deaths = stats.general.average.deaths;
    damage = stats.general.average.damage;
    healing = stats.general.average.healing;
  }

  const key = role || 'all';
  const max = RADAR_MAX[key] || RADAR_MAX.all;
  const survival = deaths > 0 ? 1 - Math.min(deaths / max[2], 1) : 1;

  return [
    Math.min(elims / max[0], 1),
    Math.min(assists / max[1], 1),
    survival,
    Math.min(damage / max[3], 1),
    Math.min(healing / max[4], 1),
  ];
}

export function getRadarMedianData(role: string | null): number[] {
  const key = role || 'all';
  const median = RADAR_MEDIANS[key] || RADAR_MEDIANS.all;
  const max = RADAR_MAX[key] || RADAR_MAX.all;

  return [
    Math.min(median[0] / max[0], 1),
    Math.min(median[1] / max[1], 1),
    median[2],
    Math.min(median[3] / max[3], 1),
    Math.min(median[4] / max[4], 1),
  ];
}

export const RADAR_LABELS = ['Elims', 'Assists', 'Survival', 'Damage', 'Healing'];

// ---- Hero Tier List ----
export interface TierEntry {
  heroKey: string;
  score: number;
  winrate: number;
  kda: number;
  games: number;
}

export function calculateHeroTiers(
  heroes: Record<string, HeroStatEntry>
): Record<string, TierEntry[]> {
  const entries: TierEntry[] = [];

  for (const [key, hero] of Object.entries(heroes)) {
    if (hero.games_played < 3) continue;
    const gameWeight = Math.min(1, hero.games_played / 30);
    const score = (hero.winrate * 0.5 + hero.kda * 8.0 + hero.games_played * 0.1) * (0.5 + 0.5 * gameWeight);
    entries.push({
      heroKey: key,
      score,
      winrate: hero.winrate,
      kda: hero.kda,
      games: hero.games_played,
    });
  }

  entries.sort((a, b) => b.score - a.score);
  if (entries.length === 0) return {};

  const maxScore = entries[0].score;
  const tiers: Record<string, TierEntry[]> = { S: [], A: [], B: [], C: [], D: [] };

  for (const entry of entries) {
    const ratio = maxScore > 0 ? entry.score / maxScore : 0;
    if (ratio >= 0.85) tiers.S.push(entry);
    else if (ratio >= 0.65) tiers.A.push(entry);
    else if (ratio >= 0.45) tiers.B.push(entry);
    else if (ratio >= 0.25) tiers.C.push(entry);
    else tiers.D.push(entry);
  }

  return tiers;
}

// ---- Play Style Classification ----
export interface PlayStyle {
  type: string;
  subtitle: string;
  traits: string[];
  insights: string[];
  signatureHero?: { key: string; winrate: number };
}

export function classifyPlayStyle(
  stats: PlayerStatsSummary,
  heroes: Record<string, HeroStatEntry>
): PlayStyle {
  const general = stats.general;
  if (!general) {
    return { type: 'Unknown', subtitle: 'Not enough data', traits: [], insights: [] };
  }

  const roles = stats.roles || {};
  let dominantRole = 'damage';
  let maxTime = 0;
  for (const [role, data] of Object.entries(roles)) {
    if (data.time_played > maxTime) {
      maxTime = data.time_played;
      dominantRole = role;
    }
  }

  const elimsPer10 = general.average.eliminations;
  const deathsPer10 = general.average.deaths;
  const damagePer10 = general.average.damage;
  const healingPer10 = general.average.healing;
  const kda = general.kda;
  const winrate = general.winrate;

  const isAggressive = elimsPer10 > 25 || damagePer10 > 10000;
  const isSurvivor = deathsPer10 < 7;
  const isHealer = healingPer10 > 8000;

  let type = 'Balanced Player';
  let subtitle = 'Well-rounded across all areas';
  const traits: string[] = [];
  const insights: string[] = [];

  if (dominantRole === 'support') {
    if (isHealer && isSurvivor) {
      type = 'Guardian Angel';
      subtitle = 'Exceptional healer who stays alive';
    } else if (isHealer && isAggressive) {
      type = 'Battle Medic';
      subtitle = 'Aggressive support with high damage';
    } else if (isHealer) {
      type = 'Dedicated Healer';
      subtitle = 'Focused on keeping the team alive';
    } else {
      type = 'DPS Support';
      subtitle = 'Damage-oriented support player';
    }
  } else if (dominantRole === 'tank') {
    if (isAggressive && isSurvivor) {
      type = 'Unstoppable Force';
      subtitle = 'Aggressive frontline with high survivability';
    } else if (isAggressive) {
      type = 'Brawler';
      subtitle = 'In-your-face tank play';
    } else if (isSurvivor) {
      type = 'Iron Wall';
      subtitle = 'Defensive anchor for the team';
    } else {
      type = 'Space Maker';
      subtitle = 'Creates room for the team';
    }
  } else {
    if (isAggressive && isSurvivor) {
      type = 'Aggressive Slayer';
      subtitle = 'High kill threat with great survival';
    } else if (isAggressive) {
      type = 'Glass Cannon';
      subtitle = 'Explosive damage output';
    } else if (isSurvivor) {
      type = 'Methodical Assassin';
      subtitle = 'Patient and precise';
    } else {
      type = 'Team Fighter';
      subtitle = 'Focused on team play';
    }
  }

  if (elimsPer10 > 25) traits.push('High Elims');
  if (damagePer10 > 10000) traits.push('High Damage');
  if (healingPer10 > 8000) traits.push('Strong Healing');
  if (deathsPer10 < 7) traits.push('Great Survival');
  if (kda > 4) traits.push('Efficient KDA');
  if (winrate > 0.55) traits.push('Winning Record');
  if (general.average.assists > 15) traits.push('Team Player');

  if (deathsPer10 > 10) insights.push('Consider positioning more carefully to reduce deaths');
  if (winrate < 0.45) insights.push('Focus on teamwork and coordination to improve win rate');
  if (kda < 2) insights.push('Try to get more value before dying — trade kills at minimum');
  if (damagePer10 > 12000 && healingPer10 < 1000 && dominantRole !== 'support')
    insights.push('Strong damage output — keep up the pressure');
  if (healingPer10 > 10000) insights.push('Excellent healing output — your team benefits greatly');

  // Signature hero
  let signatureHero: PlayStyle['signatureHero'] | undefined;
  let bestScore = 0;
  for (const [key, hero] of Object.entries(heroes)) {
    if (hero.games_played < 3) continue;
    const score = hero.winrate * 0.6 + (hero.games_played / 100) * 0.4;
    if (score > bestScore) {
      bestScore = score;
      signatureHero = { key, winrate: hero.winrate };
    }
  }

  return { type, subtitle, traits, insights, signatureHero };
}

// ---- Queue Recommendation ----
export function getQueueRecommendation(
  roles: Record<string, RoleStatEntry>
): { role: string; score: number }[] {
  const results: { role: string; score: number }[] = [];

  for (const [role, data] of Object.entries(roles)) {
    if (role === 'open') continue;
    const wrScore = data.winrate * 0.6;
    const kdaScore = Math.min(data.kda, 30) / 30 * 0.25;
    const gamesScore = Math.min(data.games_played, 50) / 50 * 0.15;
    results.push({ role, score: wrScore + kdaScore + gamesScore });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

// ---- Rank Estimation ----
export function estimateRank(
  stats: PlayerStatsSummary,
  role: string
): { rank: string; confidence: number } {
  const roleData = stats.roles?.[role] || stats.general;
  if (!roleData) return { rank: 'Unknown', confidence: 0 };

  const benchmarks = RANK_BENCHMARKS[role] || RANK_BENCHMARKS.damage;
  const elims = roleData.average.eliminations;
  const deaths = roleData.average.deaths;
  const damage = roleData.average.damage;
  const healing = roleData.average.healing;

  let bestRank = 'bronze';
  let bestDistance = Infinity;

  for (const [rank, bench] of Object.entries(benchmarks)) {
    const elimDiff = (elims - bench.elims) / Math.max(bench.elims, 1);
    const deathDiff = (bench.deaths - deaths) / Math.max(bench.deaths, 1);
    const damageDiff = (damage - bench.damage) / Math.max(bench.damage, 1);
    const healDiff = role === 'support'
      ? (healing - bench.healing) / Math.max(bench.healing, 1)
      : 0;

    const distance = Math.abs(elimDiff) * 0.3 + Math.abs(deathDiff) * 0.25 +
      Math.abs(damageDiff) * 0.25 + Math.abs(healDiff) * 0.2;

    if (distance < bestDistance) {
      bestDistance = distance;
      bestRank = rank;
    }
  }

  const confidence = Math.max(0, Math.min(1, 1 - bestDistance));
  return {
    rank: bestRank.charAt(0).toUpperCase() + bestRank.slice(1),
    confidence,
  };
}

// ---- Hero Pool Analysis ----
export interface HeroPoolAnalysis {
  diversityScore: number;
  heroCount: number;
  tankCount: number;
  damageCount: number;
  supportCount: number;
  warnings: string[];
}

export function analyzeHeroPool(
  heroes: Record<string, HeroStatEntry>
): HeroPoolAnalysis {
  const played = Object.entries(heroes).filter(([, h]) => h.games_played >= 3);
  const heroCount = played.length;

  let tankCount = 0, damageCount = 0, supportCount = 0;
  for (const [key] of played) {
    const role = getHeroRole(key);
    if (role === 'tank') tankCount++;
    else if (role === 'damage') damageCount++;
    else if (role === 'support') supportCount++;
  }

  const diversityScore = Math.min(1, heroCount / 10);
  const warnings: string[] = [];

  if (heroCount <= 2) warnings.push('Very small hero pool — consider expanding');
  if (tankCount === 0) warnings.push('No tank heroes played');
  if (damageCount === 0) warnings.push('No damage heroes played');
  if (supportCount === 0) warnings.push('No support heroes played');

  const topHero = played.sort((a, b) => b[1].games_played - a[1].games_played)[0];
  if (topHero) {
    const totalGames = played.reduce((s, [, h]) => s + h.games_played, 0);
    if (topHero[1].games_played / totalGames > 0.5) {
      warnings.push(`One-trick alert: ${topHero[0]} has ${Math.round(topHero[1].games_played / totalGames * 100)}% of your games`);
    }
  }

  return { diversityScore, heroCount, tankCount, damageCount, supportCount, warnings };
}

// ---- Personalized Tips ----
export function getPersonalizedTips(stats: PlayerStatsSummary): string[] {
  const tips: string[] = [];
  const general = stats.general;
  if (!general) return tips;

  if (general.average.deaths > 10)
    tips.push('Your death rate is high. Focus on positioning and using cover more effectively.');
  if (general.winrate < 0.45)
    tips.push('Your win rate is below average. Try to group up with your team more and communicate.');
  if (general.kda < 2)
    tips.push('Your KDA could improve. Try to confirm kills before taking risks.');
  if (general.average.damage > 12000 && general.average.healing < 1000)
    tips.push('Great damage output! Make sure you\'re also focusing objectives.');
  if (general.average.healing > 10000)
    tips.push('Excellent healing! Keep supporting your team while watching for flankers.');
  if (general.kda > 4 && general.winrate > 0.55)
    tips.push('Strong performance! Consider expanding your hero pool to climb further.');
  if (general.average.eliminations > 30)
    tips.push('Outstanding eliminations! You\'re a high-impact player.');

  if (tips.length === 0) {
    tips.push('Keep up the good work! Focus on consistency and communication.');
  }

  return tips;
}

// ---- Top Heroes ----
export function getTopHeroes(
  heroes: Record<string, HeroStatEntry>,
  count: number = 3
): { key: string; stats: HeroStatEntry }[] {
  return Object.entries(heroes)
    .sort((a, b) => b[1].time_played - a[1].time_played)
    .slice(0, count)
    .map(([key, stats]) => ({ key, stats }));
}

export function getAllHeroesSorted(
  heroes: Record<string, HeroStatEntry>
): { key: string; stats: HeroStatEntry }[] {
  return Object.entries(heroes)
    .sort((a, b) => b[1].time_played - a[1].time_played)
    .map(([key, stats]) => ({ key, stats }));
}
