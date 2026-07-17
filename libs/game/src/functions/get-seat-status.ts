import { match } from 'ts-pattern';

import type { Player } from '../interfaces/player';
import { IS_AUTO_HUMAN } from './auto-human';

// The status line shown while a seat's action turn is parked awaiting endTurn.
export function getSeatStatus(player: Player): string {
  return match(player)
    .when(
      () => player.isHuman && !IS_AUTO_HUMAN,
      () => 'YOUR TURN — recruit, attack or trade. End turn when done.',
    )
    .otherwise(() => `${player.name} is taking actions…`);
}
