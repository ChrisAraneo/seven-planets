import { assign } from 'lodash-es';

import { getPickStatus } from '../../functions/extractors/get-pick-status';
import { isHumanControlled } from '../../functions/is-human-controlled';
import { setStatus } from '../../functions/set-status';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import type { DraftFrame } from './seat-frame';
import { seatPlayer } from './seat-player';

export const parkPick = ({ state, cursor }: DraftFrame): GameState =>
  chain(seatPlayer({ state, cursor }))
    .tap((player) =>
      assign(
        state,
        setStatus(
          state,
          getPickStatus(
            state,
            player.id,
            state.draftPlanetId,
            {
              picks: cursor.picksTotal,
              counter: cursor.pick,
              slot: cursor.slot,
            },
            isHumanControlled(player),
          ),
        ),
      ),
    )
    .thru(() =>
      assign(state, { isAwaitingPick: true, inputSeq: state.inputSeq + 1 }),
    )
    .value();
