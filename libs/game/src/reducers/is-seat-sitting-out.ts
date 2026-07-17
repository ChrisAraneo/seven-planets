import { chain } from '../utils/chain';
import type { ActionFrame } from './seat-frame';
import { seatPlayer } from './seat-player';

export const isSeatSittingOut = (frame: ActionFrame): boolean =>
  chain(seatPlayer(frame))
    .thru((player) => !player.isAlive || player.isSkippedNow)
    .value();
