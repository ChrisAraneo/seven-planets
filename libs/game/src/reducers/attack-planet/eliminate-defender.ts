import { assign, fromPairs } from 'lodash-es';

import { CARD_TYPES, INFLUENCE_TYPES } from '../../config/constants';
import { formatCards } from '../../functions/format-cards';
import { getHandSize } from '../../functions/get-hand-size';
import { log } from '../../functions/log';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { lootCards } from './loot-cards';

const ELIMINATION_LOOT_CAP = 6;
export const eliminateDefender = (
  state: GameState,
  attackerId: number,
  defenderId: number,
): void =>
  void chain(state)
    .tap(() =>
      lootCards(
        state,
        defenderId,
        attackerId,
        Math.min(ELIMINATION_LOOT_CAP, getHandSize(state.players[defenderId])),
        (taken) =>
          `💰 ${state.players[attackerId].name} salvages ${formatCards(taken)} from the ruins!`,
      ),
    )
    .tap(() =>
      assign(state.players[defenderId], {
        hand: {
          ...state.players[defenderId].hand,
          ...fromPairs(
            [...CARD_TYPES, ...INFLUENCE_TYPES].map((cardType) => [
              cardType,
              0,
            ]),
          ),
        },
        isAlive: false,
      }),
    )
    .tap(() =>
      assign(
        state,
        log(
          state,
          `☠️ ${state.players[defenderId].name} has been wiped from the galaxy!`,
          'war',
        ),
      ),
    )
    .value();
