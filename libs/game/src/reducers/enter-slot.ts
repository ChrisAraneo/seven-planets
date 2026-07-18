import { assign } from 'lodash-es';

import { getOwnedPlanets } from '../functions/extractors/get-owned-planets';
import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import { computeSlotPicksTotal } from './compute-slot-picks-total';
import type { DraftFrame } from './seat-frame';
import { seatPlayer } from './seat-player';

export const enterSlot = (frame: DraftFrame): GameState =>
  chain(seatPlayer(frame))
    .thru((player) =>
      assign(frame.state, {
        cursor: {
          ...frame.cursor,
          pick: 0,
          picksTotal: computeSlotPicksTotal(frame, player),
        },
        activeId: player.id,
        draftPlanetId: getOwnedPlanets(frame.state, player)[frame.cursor.slot]
          .id,
      }),
    )
    .value();
