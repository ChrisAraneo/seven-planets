import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import type { PoolType } from '../interfaces/pool-type';
import { computeSingularityTotal } from './compute-singularity-total';
import { drawActionCard } from './draw-action-card';
import { drawResourceCard } from './draw-resource-card';
import { filterAlivePlayers } from './filter-alive-players';

const SINGULARITY_RESOURCE_ODDS = 0.55;
export const getSingularityBonusSlots = (state: GameState): PoolType[] =>
  Array.from(
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
