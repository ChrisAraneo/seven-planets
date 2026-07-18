import { match } from 'ts-pattern';

import type { Player } from '../interfaces/player';
import { nonNullable } from '../utils/p';
import type { GameOverReason } from './trigger-game-over';

export const getStatusLine = (
  winner: Player | null,
  reason: GameOverReason,
): string =>
  match(winner)
    .with(
      nonNullable,
      (player) => `GAME OVER — ${player.name} wins by ${reason}.`,
    )
    .otherwise(() => 'GAME OVER — your homeworld has fallen.');
