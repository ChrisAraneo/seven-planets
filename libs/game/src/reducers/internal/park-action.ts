import { assign } from 'lodash-es';

import { getSeatStatus } from '../../functions/extractors/get-seat-status';
import { setStatus } from '../../functions/set-status';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import type { ActionFrame } from './seat-frame';
import { seatPlayer } from './seat-player';

export const parkAction = (frame: ActionFrame): GameState =>
  chain(seatPlayer(frame))
    .tap((player) => assign(frame.state, { activeId: player.id }))
    .tap((player) =>
      assign(frame.state, setStatus(frame.state, getSeatStatus(player))),
    )
    .thru(() =>
      assign(frame.state, {
        isAwaitingAction: true,
        inputSeq: frame.state.inputSeq + 1,
      }),
    )
    .value();
