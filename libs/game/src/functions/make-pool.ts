import { chain } from '../utils/chain';
import { match } from 'ts-pattern';
import {
  ACTION_CARDS_FROM_TURN,
  ADVANCED_FROM_TURN,
  BUILD_ORDER,
  BUILDINGS_FROM_TURN,
  choice,
  INFLUENCE_CARDS,
  INFLUENCE_CARDS_FROM_TURN,
  shuffleArray,
} from '../config/constants';
import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import type { InfluenceType } from '../interfaces/influence-type';
import type { PoolType } from '../interfaces/pool-type';

import { filterAlivePlayers } from './filter-alive-players';
import { drawActionCard } from './draw-action-card';
import { drawResourceCard } from './draw-resource-card';
import { isSingularityInPlay } from './is-singularity-in-play';
import { singularityTotal } from './singularity-total';

export function makePool(state: GameState): PoolType[] {
  return match(state.turn)
    .when(
      // Turns 1–5: pure resource draft, 14 random resource cards.
      (turn) => turn < BUILDINGS_FROM_TURN,
      (): PoolType[] =>
        Array.from({ length: 14 }, () => drawResourceCard(state)),
    )
    .otherwise(() => makeMidGamePool(state));
}

// Turn 6+: 5 unique buildings + 11 other cards = 16 total.
function makeMidGamePool(state: GameState): PoolType[] {
  return chain({
    buildingSlots: shuffleArray([...eligibleBuildings(state)]).slice(0, 5),
    actionCount: match(state.turn)
      .when(
        (turn) => turn >= ACTION_CARDS_FROM_TURN,
        (): number => 6,
      )
      .otherwise((): number => 0),
  })
    .thru(({ buildingSlots, actionCount }): PoolType[] => [
      ...buildingSlots,
      ...Array.from({ length: 11 - actionCount }, () =>
        drawResourceCard(state),
      ),
      ...Array.from({ length: actionCount }, () => drawActionCard(state)),
      ...influenceSlots(state),
      ...singularityBonusSlots(state),
    ])
    .thru((pool) => shuffleArray(pool))
    .value();
}

function eligibleBuildings(state: GameState): BuildingType[] {
  return BUILD_ORDER.filter((buildingType) =>
    match(buildingType)
      .with('LAB', () => state.turn >= ADVANCED_FROM_TURN)
      .with('SINGULARITY', () => isSingularityInPlay(state))
      .otherwise(() => true),
  );
}

// From turn 30: 2 random influence cards join every pool.
function influenceSlots(state: GameState): PoolType[] {
  return match(state.turn)
    .when(
      (turn) => turn >= INFLUENCE_CARDS_FROM_TURN,
      (): PoolType[] =>
        Array.from({ length: 2 }, () =>
          choice(Object.keys(INFLUENCE_CARDS) as InfluenceType[]),
        ),
    )
    .otherwise((): PoolType[] => []);
}

// Each Singularity level across all alive players adds 1 extra random card.
function singularityBonusSlots(state: GameState): PoolType[] {
  return Array.from(
    {
      length: filterAlivePlayers(state).reduce(
        (sum, player) => sum + singularityTotal(state, player),
        0,
      ),
    },
    () =>
      match(Math.random())
        .when(
          (roll) => roll < 0.55,
          () => drawResourceCard(state),
        )
        .otherwise(() => drawActionCard(state)),
  );
}
