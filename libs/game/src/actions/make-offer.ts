import type { Cost } from '../interfaces/cost';
import type { GameState } from '../interfaces/game-state';
import { getGameState } from '../game-state';

import { fmtCards, RESOURCE_TYPES, CARDS } from '../config/constants';
import { setStatus } from '../functions/set-status';
import { AUTO_HUMAN } from '../functions/auto-human';
import { hasActionCard } from '../functions/has-action-card';
import { log } from '../functions/log';
import { setOfferResolve } from '../functions/resolver-state';
import { spendActionCard } from '../functions/spend-action-card';

export interface MakeOfferPayload {
  playerId: number;
  partnerId: number;
  gives: Cost;
  gets: Cost;
}

/* A trade offer parks on `pendingOffer` and waits for the partner's answer.
   Because that parked flag must be visible to the partner (the human's
   TradeOfferModal or the `ai` module watching `pendingOffer`), this works on
   the LIVE game state rather than a clone-then-replace copy — otherwise the
   offer would only appear after the wait had already ended. Pure engine results
   are applied in place via Object.assign so the live object identity is kept.
   Resolves with whether the partner accepted the deal. */
export async function makeOffer(payload: MakeOfferPayload): Promise<boolean> {
  const { playerId, partnerId, gives, gets } = payload;
  const state = getGameState();

  if (playerId !== state.activeId || state.over) {
    return false;
  }

  const player = state.players[playerId];
  const partner = state.players[partnerId];

  if (!partner || partner.id === player.id || !partner.alive) {
    return false;
  }

  if (!hasActionCard(player, 'TRADE')) {
    return false;
  }

  // Note the attempt; the AI plans at most one trade per turn off this flag
  // (nothing restricts the human's seat, matching the original behavior).
  player.tradedThisTurn = true;

  const wantKey = Object.keys(gets)[0];
  if (wantKey && RESOURCE_TYPES.includes(wantKey as never)) {
    Object.assign(
      getGameState(),
      log(
        getGameState(),
        `📡 ${player.name} opens a trade channel — seeking ${CARDS[wantKey].icon} ${CARDS[wantKey].name}`,
        'trade',
      ),
    );
  }
  const humanControlled = partner.isHuman && !AUTO_HUMAN;
  if (humanControlled) {
    Object.assign(
      getGameState(),
      setStatus(
        getGameState(),
        `${player.name} is hailing you with a trade offer…`,
      ),
    );
  }

  // Park the offer on the live state; the partner answers via resolveOffer —
  // the human through the TradeOfferModal, an AI seat through the ai module.
  const accept = await new Promise<boolean>((res) => {
    setOfferResolve(res);
    getGameState().pendingOffer = {
      fromId: playerId,
      toId: partnerId,
      gives,
      gets,
    };
  });

  // resolveOffer may have replaced the state object — re-read by id.
  const cur = getGameState();
  if (cur.over) {
    return accept;
  }
  if (accept) {
    execTrade(cur, playerId, partnerId, gives, gets);
    return true;
  }
  Object.assign(
    getGameState(),
    log(
      getGameState(),
      `🔁 ${cur.players[partnerId].name} declines ${cur.players[playerId].name}'s trade offer.`,
      'trade',
    ),
  );
  return false;
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
