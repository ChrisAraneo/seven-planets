import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import { IS_AUTO_HUMAN } from './auto-human';
import { filterAlivePlayers } from './filter-alive-players';
import { triggerGameOver } from './trigger-game-over';

export const checkWin = (state: GameState): GameState =>
  match({ state, alivePlayers: filterAlivePlayers(state) })
    .when(
      ({ state: eachState }) => eachState.over,
      ({ state: eachState }) => eachState,
    )
    .when(
      ({ alivePlayers }) => alivePlayers.length === 1,
      ({ state: eachState, alivePlayers }) =>
        triggerGameOver(eachState, alivePlayers[0].id, 'CONQUEST'),
    )
    .when(
      ({ state: eachState }) => !IS_AUTO_HUMAN && !eachState.players[0].isAlive,
      ({ state: eachState }) => triggerGameOver(eachState, null, 'ELIMINATED'),
    )
    .otherwise(({ state: eachState }) => eachState);
