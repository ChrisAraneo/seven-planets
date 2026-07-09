import { getTurn } from '@/stores/game/getters/get-turn';
import {
  ACTION_CARDS_FROM_TURN,
  ADVANCED_FROM_TURN,
  BUILD_ORDER,
  BUILDINGS_FROM_TURN,
  choice,
  INFLUENCE_CARDS,
  INFLUENCE_CARDS_FROM_TURN,
  shuffleArr,
} from '@/game/config/constants';
import type { GameState, InfluenceType, PoolType } from '@/game/types';

import { filterAlivePlayers } from '@/stores/game/functions/filter-alive-players';
import { drawActionCard } from './draw-action-card';
import { drawResourceCard } from './draw-resource-card';
import { isSingularityInPlay } from './is-singularity-in-play';
import { singularityTotal } from './singularity-total';

export function makePool(state: GameState): PoolType[] {
  // Turns 1–5: pure resource draft, 14 random resource cards.
  if (getTurn() < BUILDINGS_FROM_TURN) {
    const pool: PoolType[] = [];
    for (let i = 0; i < 14; i++) {
      pool.push(drawResourceCard());
    }
    return pool;
  }

  // Turn 6+: 5 unique buildings + 11 other cards = 16 total.
  const eligibleBuildings = BUILD_ORDER.filter((b) => {
    if (b === 'LAB' && getTurn() < ADVANCED_FROM_TURN) {
      return false;
    }
    if (b === 'SINGULARITY') {
      return isSingularityInPlay(state);
    }
    return true;
  });
  const buildingSlots = shuffleArr([...eligibleBuildings]).slice(0, 5);
  const actionCount = getTurn() >= ACTION_CARDS_FROM_TURN ? 6 : 0;
  const resourceSlots = Array.from({ length: 11 - actionCount }, () =>
    drawResourceCard(),
  );
  const actionSlots = Array.from({ length: actionCount }, () =>
    drawActionCard(),
  );

  // From turn 30: 2 random influence cards join every pool.
  const influenceSlots: PoolType[] =
    getTurn() >= INFLUENCE_CARDS_FROM_TURN
      ? Array.from({ length: 2 }, () =>
          choice(Object.keys(INFLUENCE_CARDS) as InfluenceType[]),
        )
      : [];

  // Each Singularity level across all alive players adds 1 extra random card.
  const singBonus = filterAlivePlayers(state).reduce(
    (s, p) => s + singularityTotal(state, p),
    0,
  );
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
