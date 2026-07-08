// NOTE: This function is not used anywhere in the current codebase.
// It was part of the old non-mastermind AI personality system.
import {
  ACTION_CARDS_FROM_TURN,
  COMBAT,
  HOME_FIELD,
  SHIELD_DEFENSE,
} from '@/game/constants';
import type { GameState, Planet, Player } from '@/game/types';
import { aiMayTarget } from './ai-may-target';
import { alivePlayers } from './alive-players';
import { hasActionCard } from './has-action-card';
import { hasBuilding } from './has-building';
import { isPacifist } from './is-pacifist';
import { ownedPlanets } from './owned-planets';
import { pacifistDefBonus } from './pacifist-def-bonus';
import { playerStrength } from './player-strength';
import { rocketCap } from '@/game/shared/rocket-cap';
import { siloBonus } from '@/game/shared/silo-bonus';
import { singularityDefBonus } from '@/game/shared/singularity-def-bonus';
import { underTruce } from './under-truce';
import { handSize } from './hand-size';

export function aiPickAttack(
  state: GameState,
  p: Player,
): { source: Planet; target: Planet; n: number } | null {
  if (isPacifist(p)) {
    return null;
  }
  if (!hasActionCard(p, 'ATTACK')) {
    return null;
  }
  if (state.turn < ACTION_CARDS_FROM_TURN + 2) {
    return null;
  }
  const reserve = 3;
  let source: Planet | null = null;
  let n = 0;
  for (const pl of ownedPlanets(state, p)) {
    if (!pl.buildings.SILO) {
      continue;
    }
    const nEff = Math.min(rocketCap(pl), pl.troops - reserve);
    if (nEff > n) {
      n = nEff;
      source = pl;
    }
  }
  if (!source || n < 2) {
    return null;
  }
  const myBonus = siloBonus(source);
  let needMargin =
    4 - Math.floor(state.turn / 8) - (alivePlayers(state).length === 2 ? 3 : 0);
  needMargin = Math.max(-6, needMargin);

  let best: { source: Planet; target: Planet; n: number } | null = null;
  let bestScore = -Infinity;
  for (const pl of state.planets) {
    if (pl.ownerId === p.id || underTruce(state, pl)) {
      continue;
    }
    const d = state.players[pl.ownerId];
    if (!aiMayTarget(p, d)) {
      continue;
    }
    const defense =
      COMBAT.defensePerTroop * pl.troops +
      (pl.buildings.SHIELD || 0) * SHIELD_DEFENSE +
      pacifistDefBonus(state, pl) +
      singularityDefBonus(pl) +
      HOME_FIELD;
    const margin = COMBAT.attackPerTroop * n + myBonus - defense;
    if (margin < needMargin) {
      continue;
    }
    let score = margin + handSize(d) * 0.6 + d.planets.length * 2;
    if (pl.buildings.SINGULARITY) {
      score += 3 * pl.buildings.SINGULARITY;
    }
    if (hasBuilding(state, d, 'LAB')) {
      score += 4;
    }
    if (d.planets.length === 1 && pl.troops <= 2) {
      score += 8;
    }
    if (score > bestScore) {
      bestScore = score;
      best = { source, target: pl, n };
    }
  }
  return best;
}
