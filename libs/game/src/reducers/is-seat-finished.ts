import { getOwnedPlanets } from '../functions/extractors/get-owned-planets';
import { chain } from '../utils/chain';
import type { DraftFrame } from './seat-frame';
import { seatPlayer } from './seat-player';

export const isSeatFinished = (frame: DraftFrame): boolean =>
  chain(seatPlayer(frame))
    .thru(
      (player) =>
        player.isSkippedNow ||
        !player.isAlive ||
        frame.cursor.slot >= getOwnedPlanets(frame.state, player).length,
    )
    .value();
