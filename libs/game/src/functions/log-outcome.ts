import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { nonNullable } from '../utils/p';
import { log } from './log';
import type { GameOverReason } from './trigger-game-over';

export const logOutcome = (
  state: GameState,
  winner: Player | null,
  reason: GameOverReason,
): GameState =>
  match({ winner, reason })
    .with({ reason: 'CONQUEST', winner: nonNullable }, ({ winner: player }) =>
      log(
        state,
        `🏴 ${player.name} rules all seven planets! The galaxy has 1 master.`,
        'win',
      ),
    )
    .with({ reason: 'ELIMINATED' }, () =>
      log(
        state,
        '☠️ Your homeworld has fallen. The galaxy forgets Terra Prime.',
        'win',
      ),
    )
    .otherwise(() => state);
