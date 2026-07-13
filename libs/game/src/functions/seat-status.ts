import { match } from 'ts-pattern';

import type { Player } from '../interfaces/player';
import { AUTO_HUMAN } from './auto-human';

// The status line shown while a seat's action turn is parked awaiting endTurn.
export function seatStatus(player: Player): string {
  return match(player)
    .when(
      (player) => player.isHuman && !AUTO_HUMAN,
      () => 'YOUR TURN — recruit, attack or trade. End turn when done.',
    )
    .otherwise((player) => `${player.name} is taking actions…`);
}
