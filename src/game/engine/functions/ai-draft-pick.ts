import { mastermindDraftPick } from '@/game/ai/ai';
import { CARDS, PRIORITIES, ACTION_TYPES } from '@/game/constants';
import type { Player, Planet, InfluenceType } from '@/game/types';
import { getState } from '../state';
import { aiPickCoupTarget } from './ai-pick-coup-target';
import { alivePlayers } from './alive-players';
import { canPickCard } from './can-pick-card';
import { currentGoal } from './current-goal';
import { hasBuilding } from './has-building';
import { influenceTarget } from './influence-target';
import { isPacifist } from './is-pacifist';
import { ownedPlanets } from './owned-planets';
import { persOf } from './pers-of';
import { playerStrength } from './player-strength';
import { totalTroops } from './total-troops';
import { troopTarget } from './troop-target';
import { underTruce } from './under-truce';

// Pick for `planet`'s draft turn. Returns -1 when nothing in the pool is pickable.
export function aiDraftPick(p: Player, planet: Planet): number {
  // MASTERMIND: the advanced planner in ./ai scores every pickable card
  // (own value + denial value) against its rolling multi-turn plan.
  if (persOf(p) === 'mastermind') {
    const pickable = getState().pool.map((t) => canPickCard(p, t, planet));
    return mastermindDraftPick(getState(), p, planet, pickable);
  }
  // Random strategy: pick any pickable card uniformly at random.
  if (persOf(p) === 'random') {
    const pickable: number[] = [];
    for (let i = 0; i < getState().pool.length; i++) {
      if (canPickCard(p, getState().pool[i], planet)) {
        pickable.push(i);
      }
    }
    return pickable.length > 0
      ? pickable[Math.floor(Math.random() * pickable.length)]
      : -1;
  }
  const goal = currentGoal(p);
  const missing: Record<string, number> = {};
  if (goal) {
    for (const t in goal.cost) {
      const short = goal.cost[t] - p.hand[t];
      if (short > 0) {
        missing[t] = short;
      }
    }
  }
  let bestIdx = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < getState().pool.length; i++) {
    const t = getState().pool[i];
    if (!canPickCard(p, t, planet)) {
      continue;
    }
    let score: number;
    if (CARDS[t].building) {
      const pr = PRIORITIES[persOf(p)].indexOf(t as any);
      score = 3.2 - pr * 0.22 + Math.random() * 0.5;
      if (goal && t === goal.id) {
        score += 3;
      }
      if (t === 'BARRACKS' && !hasBuilding(p, 'BARRACKS')) {
        score += 2.5;
      }
      if (t === 'LAB' && !hasBuilding(p, 'LAB')) {
        score += 1.5;
      }
      if (t === 'SILO' && !hasBuilding(p, 'SILO')) {
        score += 2;
      }
      if (t === 'SILO' && p.hand.ATTACK >= 3) {
        score += 2.5;
      }
      if (
        t === 'EMBASSY' &&
        !hasBuilding(p, 'EMBASSY') &&
        (persOf(p) === 'hoarder' ||
          persOf(p) === 'trader' ||
          persOf(p) === 'pacifist')
      ) {
        score += 1.5;
      }
      if (
        t === 'SPACEPORT' &&
        !hasBuilding(p, 'SPACEPORT') &&
        p.planets.length >= 2
      ) {
        score += 1.2;
      }
      if (t === 'SINGULARITY') {
        score += 5;
      }
    } else if (CARDS[t].influenceCard) {
      const it = t as InfluenceType;
      const pers = persOf(p);
      score = 2 + Math.random() * 0.6;
      if (it.startsWith('SKIP_')) {
        const target = influenceTarget(p, it);
        const allStr = alivePlayers().map((x) => playerStrength(x));
        const avgStr = allStr.reduce((a, b) => a + b, 0) / (allStr.length || 1);
        score = target
          ? 1.5 + (playerStrength(target) / Math.max(1, avgStr)) * 1.5
          : 1;
        if (pers === 'opportunist') {
          score += 1.5;
        }
        if (
          pers === 'aggressor' ||
          pers === 'militarist' ||
          pers === 'blitzer'
        ) {
          score += 1;
        }
        if (pers === 'expansionist') {
          score += 0.5;
        }
      } else {
        switch (it) {
          case 'STEAL_ACTION': {
            const loot = alivePlayers().some(
              (x) => x.id !== p.id && ACTION_TYPES.some((a) => x.hand[a] > 0),
            );
            score += loot ? 0.8 : -3;
            if (pers === 'opportunist' || pers === 'trader') {
              score += 1;
            }
            if (
              pers === 'militarist' ||
              pers === 'aggressor' ||
              pers === 'blitzer'
            ) {
              score += 0.8;
            }

            break;
          }
          case 'COUP': {
            score = aiPickCoupTarget(p) ? 7 : -3;
            if (aiPickCoupTarget(p)) {
              if (pers === 'pacifist' || isPacifist(p)) {
                score += 5;
              } else {
                switch (pers) {
                  case 'expansionist': {
                    score += 2;
                    break;
                  }
                  case 'opportunist': {
                    score += 1.5;
                    break;
                  }
                  case 'militarist':
                  case 'aggressor': {
                    {
                      score += 1;
                      // No default
                    }
                    break;
                  }
                }
              }
            }

            break;
          }
          case 'PEACE': {
            const weak = ownedPlanets(p).some(
              (pl) => pl.troops <= 3 && !underTruce(pl),
            );
            score += weak ? 2 : -1;
            if (
              pers === 'pacifist' ||
              pers === 'fortifier' ||
              pers === 'rusher'
            ) {
              score += 1;
            }
            if (
              pers === 'economist' ||
              pers === 'hoarder' ||
              pers === 'builder'
            ) {
              score += 0.5;
            }

            break;
          }
          // No default
        }
      }
      // Pacifists bank every ⭐ for the 20-cost Coup — they refuse cheaper cards.
      if ((pers === 'pacifist' || isPacifist(p)) && it !== 'COUP') {
        score -= 4;
      }
      if (p.hand[it] > 0) {
        score -= 1.5;
      }
    } else {
      const pers = persOf(p);
      score = CARDS[t].value + Math.random() * 0.4;
      if (missing[t]) {
        score += 2.5;
      }
      switch (t) {
        case 'RECRUIT': {
          if (
            p.hand.RECRUIT === 0 &&
            ownedPlanets(p).some((pl) => pl.troops < troopTarget(p))
          ) {
            score += 1.6;
          }
          if (pers === 'militarist' || pers === 'blitzer') {
            score += 1.4;
          }

          break;
        }
        case 'ATTACK': {
          if (pers === 'aggressor') {
            score += 1.2;
          }
          if (pers === 'militarist') {
            score += 2;
          }
          if (pers === 'blitzer') {
            score += 1.8;
          }
          if (pers === 'expansionist' || pers === 'opportunist') {
            score += 0.8;
          }
          if (
            pers === 'rusher' ||
            pers === 'fortifier' ||
            pers === 'trader' ||
            pers === 'pacifist' ||
            isPacifist(p)
          ) {
            score -= 2;
          }
          if (p.hand.ATTACK === 0 && totalTroops(p) >= 4) {
            score += 1;
          }

          break;
        }
        case 'MOVE': {
          if (p.hand.MOVE === 0 && p.planets.length >= 2) {
            score += 1;
          }

          break;
        }
        case 'TRADE': {
          if (pers === 'hoarder' && p.hand.TRADE === 0) {
            score += 0.8;
          }
          if (
            (pers === 'rusher' || pers === 'economist') &&
            p.hand.TRADE === 0
          ) {
            score += 1.2;
          }
          if (
            (pers === 'trader' ||
              pers === 'pacifist' ||
              pers === 'opportunist') &&
            p.hand.TRADE === 0
          ) {
            score += 2.5;
          }

          break;
        }
        case 'ORE':
        case 'ENERGY': {
          if (
            pers === 'aggressor' ||
            pers === 'militarist' ||
            pers === 'blitzer'
          ) {
            score += 0.6;
          }

          break;
        }
        case 'SPICE':
        case 'CRYSTAL': {
          if (pers === 'rusher' || pers === 'trader') {
            score += 0.4;
          }

          break;
        }
        // No default
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}
