import { match } from 'ts-pattern';

import type { Player } from '../interfaces/player';
import { IS_AUTO_HUMAN } from './auto-human';

export const getSeatStatus = (player: Player): string =>
  match(player)
    .when(
      () => player.isHuman && !IS_AUTO_HUMAN,
      () => 'YOUR TURN — recruit, attack or trade. End turn when d1.',
    )
    .otherwise(() => `${player.name} is taking actions…`);
