// NOTE: This function is not used anywhere in the current codebase.
// It was part of the old non-mastermind AI personality system.
import type {
  GameState,
  InfluenceOpts,
  InfluenceType,
  Player,
} from '@/game/types';
import { ACTION_TYPES } from '@/game/constants';
import { aiMayTarget } from './ai-may-target';
import { aiPickCoupTarget } from './ai-pick-coup-target';
import { alivePlayers } from './alive-players';
import { hasBuilding } from './has-building';
import { influenceTarget } from './influence-target';
import { ownedPlanets } from './owned-planets';
import { playerStrength } from './player-strength';
import { underTruce } from './under-truce';

// Decide whether (and how) to play a held influence card this action.
export function aiPickInfluencePlay(
  state: GameState,
  p: Player,
): (InfluenceOpts & { type: InfluenceType }) | null {
  const allStr = alivePlayers(state).map((x) => playerStrength(state, x));
  const avgStr = allStr.reduce((a, b) => a + b, 0) / (allStr.length || 1);
  // Coup: seize the most developed rival planet as soon as one is worth it.
  if ((p.hand.COUP || 0) >= 1) {
    const planet = aiPickCoupTarget(state, p);
    if (planet) {
      return { type: 'COUP', planet };
    }
  }
  // Skip cards: unleash on a rival pulling ahead (or anyone in a final duel).
  for (const t of [
    'SKIP_ARMY',
    'SKIP_PLANETS',
    'SKIP_TECH',
    'SKIP_INFLUENCE',
  ] as InfluenceType[]) {
    if ((p.hand[t] || 0) < 1) {
      continue;
    }
    const target = influenceTarget(state, p, t);
    if (!target) {
      continue;
    }
    if (
      playerStrength(state, target) >= avgStr ||
      alivePlayers(state).length === 2
    ) {
      return { type: t };
    }
  }
  // Extortion: grab a card this player can use — or deny the strongest rival their Attack cards.
  if ((p.hand.STEAL_ACTION || 0) >= 1) {
    const rivals = alivePlayers(state).filter((x) => x.id !== p.id);
    const wants = ACTION_TYPES.filter((a) =>
      a === 'ATTACK'
        ? hasBuilding(state, p, 'SILO')
        : a === 'RECRUIT'
          ? hasBuilding(state, p, 'BARRACKS')
          : a === 'MOVE'
            ? hasBuilding(state, p, 'SPACEPORT') && p.planets.length >= 2
            : hasBuilding(state, p, 'EMBASSY'),
    );
    if (!wants.includes('ATTACK')) {
      wants.push('ATTACK');
    } // Pure denial
    for (const a of wants) {
      const holders = rivals
        .filter((x) => x.hand[a] > 0)
        .sort((x, y) => playerStrength(state, y) - playerStrength(state, x));
      if (holders.length > 0) {
        return { type: 'STEAL_ACTION', target: holders[0], cardType: a };
      }
    }
  }
  // Peace Treaty: pop it when a garrison runs dangerously thin.
  if (
    (p.hand.PEACE || 0) >= 1 &&
    ownedPlanets(state, p).some(
      (pl) => pl.troops <= 2 && !underTruce(state, pl),
    )
  ) {
    return { type: 'PEACE' };
  }
  return null;
}
