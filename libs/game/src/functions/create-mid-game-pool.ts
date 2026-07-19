import { match } from 'ts-pattern';

import { ACTION_CARDS_FROM_TURN } from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { PoolType } from '../interfaces/pool-type';
import { chain } from '../utils/chain';
import { drawActionCard } from './draw-action-card';
import { drawResourceCard } from './draw-resource-card';
import { getEligibleBuildings } from './extractors/get-eligible-buildings';
import { getInfluenceSlots } from './extractors/get-influence-slots';
import { getSingularityBonusSlots } from './extractors/get-singularity-bonus-slots';
import { shuffleArray } from './shuffle-array';

const BUILDING_SLOT_COUNT = 5;
const OTHER_CARD_COUNT = 11;
const ACTION_CARD_COUNT = 6;

export const createMidGamePool = (state: GameState): PoolType[] =>
  chain({
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
