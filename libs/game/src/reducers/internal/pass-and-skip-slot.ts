import { isHumanControlled } from '../../functions/is-human-controlled';
import { passSlot } from '../../functions/pass-slot';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { getDraftPlanet } from './get-draft-planet';
import { nextSlot } from './next-slot';
import type { DraftFrame } from './seat-frame';
import { seatPlayer } from './seat-player';

export const passAndSkipSlot = (frame: DraftFrame): GameState =>
  chain(seatPlayer(frame))
    .tap((player) =>
      passSlot(
        frame.state,
        player,
        getDraftPlanet(frame.state),
        isHumanControlled(player),
      ),
    )
    .thru(() => nextSlot(frame))
    .value();
