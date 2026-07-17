import { assign } from 'lodash-es';

import type { GameState } from '../interfaces/game-state';
import { announceSingularity } from './announce-singularity';
import { beginPlayerTurn } from './begin-player-turn';
import { choice } from './choice';
import { createPool } from './create-pool';
import { doIncome } from './do-income';
import { doShieldUpkeep } from './do-shield-upkeep';
import { filterAlivePlayers } from './filter-alive-players';
import { getDraftOrder } from './get-draft-order';
import { getMilestoneLogs } from './get-milestone-logs';
import { getTurnFlavor } from './get-turn-flavor';
import { log } from './log';
import { updatePacifistStatus } from './update-pacifist-status';

export const turnPrelude = (state: GameState): void => {
  assign(state, { turn: state.turn + 1 });
  state.players.forEach((player) => beginPlayerTurn(state, player));
  assign(state, updatePacifistStatus(state));
  assign(state, doIncome(state));
  assign(state, doShieldUpkeep(state));
  announceSingularity(state);
  assign(state, {
    pool: createPool(state),
    startIdx: choice(filterAlivePlayers(state)).id,
  });
  assign(
    state,
    log(
      state,
      `— TURN ${state.turn} — ${getDraftOrder(state)[0].name} drafts first${getTurnFlavor(state.turn)}`,
      'sys',
    ),
  );
  assign(state, getMilestoneLogs(state));
};
