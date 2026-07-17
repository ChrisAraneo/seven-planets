import { match, P } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { log } from './log';
import type { GameOverReason } from './trigger-game-over';

const { nonNullable } = P;
export const logOutcome = (
  state: GameState,
  winner: Player | null,
  reason: GameOverReason,
): GameState =>
  match({ winner, reason })
    .with({ reason: 'conquest', winner: nonNullable }, ({ winner: player }) =>
      log(
        state,
        `🏴 ${player.name} rules all seven planets! The galaxy has one master.`,
        'win',
      ),
    )
    .with({ reason: 'eliminated' }, () =>
      log(
        state,
        '☠️ Your homeworld has fallen. The galaxy forgets Terra Prime.',
        'win',
      ),
    )
    .otherwise(() => state);
