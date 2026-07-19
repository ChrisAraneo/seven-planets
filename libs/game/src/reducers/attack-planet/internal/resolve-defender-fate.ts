import { match } from 'ts-pattern';

import { getHandSize } from '../../../functions/extractors/get-hand-size';
import { getOwnedPlanets } from '../../../functions/extractors/get-owned-planets';
import { formatCards } from '../../../functions/format-cards';
import type { GameState } from '../../../interfaces/game-state';
import type { Hand } from '../../../interfaces/hand';
import { eliminateDefender } from './eliminate-defender';
import { lootCards } from './loot-cards';

const FLEE_LOOT_CAP = 5;

export const resolveDefenderFate = (
  state: GameState,
  attackerId: number,
  defenderId: number,
): void =>
  match(getOwnedPlanets(state, state.players[defenderId]).length)
    .with(0, () => eliminateDefender(state, attackerId, defenderId))
    .otherwise(() =>
      lootCards(
        state,
        defenderId,
        attackerId,
        Math.min(
          FLEE_LOOT_CAP,
          Math.ceil(getHandSize(state.players[defenderId]) / 2),
        ),
        (taken: Hand) =>
          `💰 ${state.players[attackerId].name} seizes ${formatCards(taken)} from the fleeing ${state.players[defenderId].name}!`,
      ),
    );
