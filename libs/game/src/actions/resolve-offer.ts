import { getGameState, setGameState } from '../game-state';
import { cloneDeep } from 'lodash-es';

import { fmtCards } from '../config/constants';
import { log } from '../functions/log';
import { spendActionCard } from '../functions/spend-action-card';
import type { Cost } from '../interfaces/cost';
import type { GameState } from '../interfaces/game-state';

export interface ResolveOfferPayload {
  playerId: number;
  accept: boolean;
}

/* The target seat of pendingOffer accepts or declines it. Executes the
   trade when accepted, logs the decline otherwise, then clears the flag. */
export function resolveOffer(payload: ResolveOfferPayload): void {
  const state = cloneDeep(getGameState());
  const { playerId, accept } = payload;

  const offer = state.pendingOffer;

  if (!offer || offer.toId !== playerId) {
    return;
  }

  state.pendingOffer = null;

  if (accept) {
    execTrade(state, offer.fromId, offer.toId, offer.gives, offer.gets);
  } else {
    Object.assign(
      state,
      log(
        state,
        `🔁 ${state.players[offer.toId].name} declines ${state.players[offer.fromId].name}'s trade offer.`,
        'trade',
      ),
    );
  }

  setGameState(state);
}

function execTrade(
  state: GameState,
  aId: number,
  bId: number,
  aGives: Cost,
  bGives: Cost,
): void {
  Object.assign(state, spendActionCard(state, aId, 'TRADE'));
  for (const t in aGives) {
    state.players[aId].hand[t] -= aGives[t];
    state.players[bId].hand[t] += aGives[t];
  }
  for (const t in bGives) {
    state.players[bId].hand[t] -= bGives[t];
    state.players[aId].hand[t] += bGives[t];
  }
  state.players[aId].influence++;
  Object.assign(
    state,
    log(
      state,
      `🔁 ${state.players[aId].name} trades ${fmtCards(aGives)} to ${state.players[bId].name} for ${fmtCards(bGives)}  [+1⭐ influence]`,
      'trade',
    ),
  );
}
