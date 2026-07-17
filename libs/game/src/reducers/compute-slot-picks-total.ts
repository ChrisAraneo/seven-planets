import { match } from 'ts-pattern';

import { getMainPicks } from '../functions/get-main-picks';
import type { Player } from '../interfaces/player';
import type { DraftFrame } from './seat-frame';

export const computeSlotPicksTotal = (
  frame: DraftFrame,
  player: Player,
): number =>
  match(frame.cursor.slot)
    .with(0, () => getMainPicks(frame.state, player))
    .otherwise(() => 1);
