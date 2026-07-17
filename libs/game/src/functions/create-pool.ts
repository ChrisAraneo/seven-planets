import { match } from 'ts-pattern';

import {
  ACTION_CARDS_FROM_TURN,
  ADVANCED_FROM_TURN,
  BUILD_ORDER,
  BUILDINGS_FROM_TURN,
  choice,
  INFLUENCE_CARDS_FROM_TURN,
  INFLUENCE_TYPES,
  shuffleArray,
} from '../config/constants';
import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import type { PoolType } from '../interfaces/pool-type';
import { chain } from '../utils/chain';
import { computeSingularityTotal } from './compute-singularity-total';
import { drawActionCard } from './draw-action-card';
import { drawResourceCard } from './draw-resource-card';
import { filterAlivePlayers } from './filter-alive-players';
import { isSingularityInPlay } from './is-singularity-in-play';

const BUILDING_SLOT_COUNT = 5;
const OTHER_CARD_COUNT = 11;
const ACTION_CARD_COUNT = 6;

const SINGULARITY_RESOURCE_ODDS = 0.55;

export function createPool(state: GameState): PoolType[] {
  return match(state.turn)
    .when(
      (turn) => turn < BUILDINGS_FROM_TURN,
      (): PoolType[] => Array.from({ length: 14 }, () => drawResourceCard()),
    )
    .otherwise(() => createMidGamePool(state));
}

function createMidGamePool(state: GameState): PoolType[] {
  return chain({
    buildingSlots: shuffleArray([...getEligibleBuildings(state)]).slice(
      0,
      BUILDING_SLOT_COUNT,
    ),
    actionCount: match(state.turn)
      .when(
        (turn) => turn >= ACTION_CARDS_FROM_TURN,
        (): number => ACTION_CARD_COUNT,
      )
      .otherwise((): number => 0),
  })
    .thru(({ buildingSlots, actionCount }): PoolType[] => [
      ...buildingSlots,
      ...Array.from({ length: OTHER_CARD_COUNT - actionCount }, () =>
        drawResourceCard(),
      ),
      ...Array.from({ length: actionCount }, () => drawActionCard(state)),
      ...getInfluenceSlots(state),
      ...getSingularityBonusSlots(state),
    ])
    .thru((pool) => shuffleArray(pool))
    .value();
}

function getEligibleBuildings(state: GameState): BuildingType[] {
  return BUILD_ORDER.filter((buildingType) =>
    match(buildingType)
      .with('LAB', () => state.turn >= ADVANCED_FROM_TURN)
      .with('SINGULARITY', () => isSingularityInPlay(state))
      .otherwise(() => true),
  );
}

function getInfluenceSlots(state: GameState): PoolType[] {
  return match(state.turn)
    .when(
      (turn) => turn >= INFLUENCE_CARDS_FROM_TURN,
      (): PoolType[] =>
        Array.from({ length: 2 }, () => choice(INFLUENCE_TYPES)),
    )
    .otherwise((): PoolType[] => []);
}

function getSingularityBonusSlots(state: GameState): PoolType[] {
  return Array.from(
    {
      length: filterAlivePlayers(state).reduce(
        (sum, player) => sum + computeSingularityTotal(state, player),
        0,
      ),
    },
    () =>
      match(Math.random())
        .when(
          (roll) => roll < SINGULARITY_RESOURCE_ODDS,
          () => drawResourceCard(),
        )
        .otherwise(() => drawActionCard(state)),
  );
}
