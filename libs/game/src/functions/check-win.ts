import { match } from 'ts-pattern';
import { filterAlivePlayers } from './filter-alive-players';
import { AUTO_HUMAN } from './auto-human';
import { triggerGameOver } from './trigger-game-over';
import type { GameState } from '../interfaces/game-state';

export function checkWin(state: GameState): GameState {
  return match({ state, alivePlayers: filterAlivePlayers(state) })
    .when(
      ({ state: s }) => s.over,
      ({ state: s }) => s,
    )
    .when(
      ({ alivePlayers }) => alivePlayers.length === 1,
      ({ state: s, alivePlayers }) =>
        triggerGameOver(s, alivePlayers[0].id, 'conquest'),
    )
    .when(
      ({ state: s }) => !AUTO_HUMAN && !s.players[0].isAlive,
      ({ state: s }) => triggerGameOver(s, null, 'eliminated'),
    )
    .otherwise(({ state: s }) => s);
}
