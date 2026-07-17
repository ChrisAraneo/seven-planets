import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import { getTechLevel } from './get-tech-level';
import { log } from './log';

export const logTechAdvance = (
  state: GameState,
  playerId: number,
  previousTech: number,
): GameState =>
  match(getTechLevel(state, state.players[playerId]))
    .when(
      (updatedTech) => updatedTech > previousTech,
      (updatedTech) =>
        log(
          state,
          `🔬 ${state.players[playerId].name} reaches TECHNOLOGY ${updatedTech} — level-${updatedTech} upgrades unlocked, and they now draft before lower-tech rivals!`,
          'sys',
        ),
    )
    .otherwise(() => state);
