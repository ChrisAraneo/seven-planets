import { match, P } from 'ts-pattern';

import type { GameOver } from '../interfaces/game-over';
import type { SimulationResult } from './simulate-game';

const { nonNullable } = P;
export const getGameResult = (
  over: GameOver | null,
  turns: number,
): SimulationResult => ({
  turns,
  winner: match(over?.winner)
    .with(nonNullable, (player) => ({
      id: player.id,
      name: player.name,
      isHuman: player.isHuman,
    }))
    .otherwise(() => null),
  reason: match(over)
    .with(nonNullable, (gameOver) => gameOver.reason)
    .otherwise(() => 'timeout'),
});
