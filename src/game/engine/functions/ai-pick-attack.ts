// The non-aggressive personalities: they raise an army purely to DEFEND, and
// Only ever march it out to finish a nearly-dead rival or pre-empt a runaway
// Leader (see aiPickAttack). Pacifists never attack at all; 'random' stays

import {
  ACTION_CARDS_FROM_TURN,
  COMBAT,
  SHIELD_DEFENSE,
  HOME_FIELD,
} from '@/game/constants';
import type { Player, Planet } from '@/game/types';
import { getState } from '../state';
import { aiMayTarget } from './ai-may-target';
import { alivePlayers } from './alive-players';
import { handSize } from './hand-size';
import { hasActionCard } from './has-action-card';
import { hasBuilding } from './has-building';
import { isPacifist } from './is-pacifist';
import { ownedPlanets } from './owned-planets';
import { pacifistDefBonus } from './pacifist-def-bonus';
import { persOf } from './pers-of';
import { playerStrength } from './player-strength';
import { rocketCap } from './rocket-cap';
import { siloBonus } from './silo-bonus';
import { singularityDefBonus } from './singularity-def-bonus';
import { underTruce } from './under-truce';

// Chaotic and is deliberately left out.
const DEFENSIVE_PERSONALITIES = new Set([
  'builder',
  'hoarder',
  'economist',
  'fortifier',
  'trader',
  'rusher',
  'balanced',
]);

export function aiPickAttack(
  p: Player,
): { source: Planet; target: Planet; n: number } | null {
  const pers = persOf(p);
  if (isPacifist(p)) {
    return null;
  } // Forsworn war permanently
  if (!hasActionCard(p, 'ATTACK')) {
    return null;
  }
  const earlyTurn =
    pers === 'aggressor' || pers === 'militarist' || pers === 'blitzer'
      ? ACTION_CARDS_FROM_TURN
      : pers === 'expansionist'
        ? ACTION_CARDS_FROM_TURN + 1
        : ACTION_CARDS_FROM_TURN + 2;
  if (getState().turn < earlyTurn) {
    return null;
  }
  const reserve =
    pers === 'militarist' || pers === 'blitzer'
      ? 1
      : pers === 'aggressor' || pers === 'expansionist'
        ? 2
        : 3;
  // Launch from the SILO planet that can field the LARGEST strike force
  let source: Planet | null = null;
  let n = 0;
  for (const pl of ownedPlanets(p)) {
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
    pers === 'militarist' || pers === 'aggressor'
      ? 0
      : pers === 'blitzer'
        ? getState().turn <= 15
          ? -2
          : 5 // All-in early, selective later
        : pers === 'opportunist'
          ? 4
          : pers === 'expansionist'
            ? 2
            : pers === 'hoarder' || pers === 'builder'
              ? 7
              : pers === 'economist'
                ? 9
                : pers === 'rusher' || pers === 'fortifier' || pers === 'trader'
                  ? 14
                  : pers === 'pacifist'
                    ? 999
                    : 4; // Pacifist truly never attacks
  // Conquest is the ONLY road to victory: everyone (except the pacifist) grows bolder over time.
  if (pers !== 'pacifist') {
    needMargin -=
      Math.floor(getState().turn / 8) + (alivePlayers().length === 2 ? 3 : 0);
    needMargin = Math.max(-6, needMargin);
  }

  const defensive = DEFENSIVE_PERSONALITIES.has(pers);
  const myStr = playerStrength(p);
  let best: { source: Planet; target: Planet; n: number } | null = null;
  let bestScore = -Infinity;
  for (const pl of getState().planets) {
    if (pl.ownerId === p.id) {
      continue;
    }
    if (underTruce(pl)) {
      continue;
    } // Freshly conquered planets are off-limits
    const d = getState().players[pl.ownerId];
    if (!aiMayTarget(p, d)) {
      continue;
    } // Kamikaze targets only the human; others ignore kamikazes
    // Defend-first personalities never attack for expansion — they only strike to
    // FINISH a nearly-dead rival, or to pre-empt one who has grown into a threat.
    if (defensive) {
      const eliminates = d.planets.length === 1; // Taking this planet ends them
      const threatening = playerStrength(d) > myStr * 1.35; // A runaway leader
      if (!eliminates && !threatening) {
        continue;
      }
    }
    const defense =
      COMBAT.defensePerTroop * pl.troops +
      (pl.buildings.SHIELD || 0) * SHIELD_DEFENSE +
      pacifistDefBonus(pl) +
      singularityDefBonus(pl) +
      HOME_FIELD;
    const margin = COMBAT.attackPerTroop * n + myBonus - defense;
    if (margin < needMargin) {
      continue;
    }
    let score = margin + handSize(d) * 0.6 + d.planets.length * 2;
    if (pers === 'expansionist') {
      score += d.planets.length * 2;
    } // Prefer multi-planet targets
    if (pers === 'opportunist') {
      score += playerStrength(d) * 0.15;
    } // Target the current leader
    if (pl.buildings.SINGULARITY) {
      score += 3 * pl.buildings.SINGULARITY;
    } // Deny the draft engine
    if (hasBuilding(d, 'LAB')) {
      score += 4;
    } // Slow their technology
    if (d.planets.length === 1 && pl.troops <= 2) {
      score += 8;
    } // Finish off the weak
    if (score > bestScore) {
      bestScore = score;
      best = { source, target: pl, n };
    }
  }
  return best;
}
