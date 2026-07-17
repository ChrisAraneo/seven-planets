import { canPickCard } from '../functions/can-pick-card';
import { chain } from '../utils/chain';
import { getDraftPlanet } from './get-draft-planet';
import type { DraftFrame } from './seat-frame';
import { seatPlayer } from './seat-player';

export const hasPickableCard = (frame: DraftFrame): boolean =>
  chain({
    player: seatPlayer(frame),
    planet: getDraftPlanet(frame.state),
  })
    .thru(({ player, planet }) =>
      frame.state.pool.some((poolType) =>
        canPickCard(frame.state, player, poolType, planet),
      ),
    )
    .value();
