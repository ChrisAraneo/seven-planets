import {
  ACTION_CARDS_FROM_TURN,
  ADVANCED_FROM_TURN,
  BUILD_ORDER,
  BUILDINGS_FROM_TURN,
  choice,
  INFLUENCE_CARDS,
  INFLUENCE_CARDS_FROM_TURN,
  shuffleArr,
} from '@/game/constants';
import { drawResourceCard } from './draw-resource-card';
import type { InfluenceType, PoolType } from '@/game/types';
import { getState } from '../state';
import { isSingularityInPlay } from './is-singularity-in-play';
import { drawActionCard } from './draw-action-card';
import { alivePlayers } from './alive-players';
import { singularityTotal } from './singularity-total';

export function makePool(): PoolType[] {
  // Turns 1–5: pure resource draft, 14 random resource cards.
  if (getState().turn < BUILDINGS_FROM_TURN) {
    const pool: PoolType[] = [];
    for (let i = 0; i < 14; i++) {
      pool.push(drawResourceCard());
    }
    return pool;
  }

  // Turn 6+: 5 unique buildings + 11 other cards = 16 total.
  const eligibleBuildings = BUILD_ORDER.filter((b) => {
    if (b === 'LAB' && getState().turn < ADVANCED_FROM_TURN) {
      return false;
    }
    if (b === 'SINGULARITY') {
      return isSingularityInPlay();
    }
    return true;
  });
  const buildingSlots = shuffleArr([...eligibleBuildings]).slice(0, 5);
  const actionCount = getState().turn >= ACTION_CARDS_FROM_TURN ? 6 : 0;
  const resourceSlots = Array.from({ length: 11 - actionCount }, () =>
    drawResourceCard(),
  );
  const actionSlots = Array.from({ length: actionCount }, () =>
    drawActionCard(),
  );

  // From turn 30: 2 random influence cards join every pool.
  const influenceSlots: PoolType[] =
    getState().turn >= INFLUENCE_CARDS_FROM_TURN
      ? Array.from({ length: 2 }, () =>
          choice(Object.keys(INFLUENCE_CARDS) as InfluenceType[]),
        )
      : [];

  // Each Singularity level across all alive players adds 1 extra random card.
  const singBonus = alivePlayers().reduce((s, p) => s + singularityTotal(p), 0);
  const bonusSlots = Array.from({ length: singBonus }, () =>
    Math.random() < 0.55 ? drawResourceCard() : drawActionCard(),
  );

  return shuffleArr([
    ...buildingSlots,
    ...resourceSlots,
    ...actionSlots,
    ...influenceSlots,
    ...bonusSlots,
  ]);
}
