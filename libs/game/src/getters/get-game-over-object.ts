import { match } from 'ts-pattern';

import { getGameStateLastValue } from '../get-game-state-last-value';
import type { GameOver } from '../interfaces/game-over';

export const getGameOverObject = (): GameOver | null =>
  match(getGameStateLastValue().over)
    .when(
      (over) => Boolean(over?.winner),
      (over) => over,
    )
    .otherwise(() => null);
