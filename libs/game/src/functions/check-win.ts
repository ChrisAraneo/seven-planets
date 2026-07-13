import { match } from 'ts-pattern';
import { filterAlivePlayers } from './filter-alive-players';
import { AUTO_HUMAN } from './auto-human';
import { triggerGameOver } from './trigger-game-over';
import type { GameState } from '../interfaces/game-state';

export function checkWin(state: GameState): GameState {
  return match({ state, alivePlayers: filterAlivePlayers(state) })
    .when(
      ({ state: eachState }) => eachState.over,
      ({ state: eachState }) => eachState,
    )
    .when(
      ({ alivePlayers }) => alivePlayers.length === 1,
      ({ state: eachState, alivePlayers }) =>
        triggerGameOver(eachState, alivePlayers[0].id, 'conquest'),
    )
    .when(
      ({ state: eachState }) => !AUTO_HUMAN && !eachState.players[0].isAlive,
      ({ state: eachState }) => triggerGameOver(eachState, null, 'eliminated'),
    )
    .otherwise(({ state: eachState }) => eachState);
}
