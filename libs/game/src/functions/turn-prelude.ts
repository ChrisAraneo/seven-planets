import { assign } from 'lodash-es';

import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import { announceSingularity } from './announce-singularity';
import { beginPlayerTurn } from './begin-player-turn';
import { choice } from './choice';
import { createPool } from './create-pool';
import { doIncome } from './do-income';
import { doShieldUpkeep } from './do-shield-upkeep';
import { getDraftOrder } from './extractors/get-draft-order';
import { getMilestoneLogs } from './extractors/get-milestone-logs';
import { getTurnFlavor } from './extractors/get-turn-flavor';
import { filterAlivePlayers } from './filter-alive-players';
import { log } from './log';
import { updatePacifistStatus } from './update-pacifist-status';

export const turnPrelude = (state: GameState): void =>
  void chain(assign(state, { turn: state.turn + 1 }))
    .tap(() =>
      state.players.forEach((player) => beginPlayerTurn(state, player)),
    )
    .tap(() => assign(state, updatePacifistStatus(state)))
    .tap(() => assign(state, doIncome(state)))
    .tap(() => assign(state, doShieldUpkeep(state)))
    .tap(() => announceSingularity(state))
    .tap(() =>
      assign(state, {
        pool: createPool(state),
        startIndex: choice(filterAlivePlayers(state)).id,
      }),
    )
    .tap(() =>
      assign(
        state,
        log(
          state,
          `— TURN ${state.turn} — ${getDraftOrder(state)[0].name} drafts first${getTurnFlavor(state.turn)}`,
          'sys',
        ),
      ),
    )
    .tap(() => assign(state, getMilestoneLogs(state)))
    .value();
