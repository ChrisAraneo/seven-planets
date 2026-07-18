import { match } from 'ts-pattern';

import { MAIN_SLOT } from '../config/constants';
import { getMainPicks } from '../functions/get-main-picks';
import type { Player } from '../interfaces/player';
import type { DraftFrame } from './seat-frame';

export const computeSlotPicksTotal = (
  frame: DraftFrame,
  player: Player,
): number =>
  match(frame.cursor.slot)
    .with(MAIN_SLOT, () => getMainPicks(frame.state, player))
    .otherwise(() => 1);
