import { match } from 'ts-pattern';

import type { GameOver } from '../interfaces/game-over';
import { nonNullable } from '../utils/p';
import type { SimulationResult } from './simulate-game';

// TODO: OK
export const createSimulationResult = (
  gameOver: GameOver | null,
  turns: number,
): SimulationResult => ({
  turns,
  winner: match(gameOver?.winner)
    .with(nonNullable, (player) => ({
      id: player.id,
      name: player.name,
      isHuman: player.isHuman,
    }))
    .otherwise(() => null),
  reason: match(gameOver)
    .with(nonNullable, (object) => object.reason)
    .otherwise(() => 'timeout'),
});
