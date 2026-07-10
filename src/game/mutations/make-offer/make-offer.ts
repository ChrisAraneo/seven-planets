import type { Cost, GameState, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { fmtCards, RESOURCE_TYPES, CARDS } from '@/game/config/constants';
import { setStatus } from '../../functions/set-status';
import { AUTO_HUMAN } from '../../functions/auto-human';
import { hasActionCard } from '../../functions/has-action-card';
import { log } from '../../functions/log';
import { setOfferResolve } from '../../functions/resolver-state';
import { spendActionCard } from '../../functions/spend-action-card';
import type { GameModuleState } from '../../game';

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
   offer would only appear after the wait had already ended. */
export async function makeOffer(
  _moduleState: GameModuleState,
  payload: MakeOfferPayload,
): Promise<void> {
  const { playerId, partnerId, gives, gets } = payload;
  const state = getGameState();

  if (playerId !== state.activeId || state.over) {
    return;
  }

  const player = state.players[playerId];
  const partner = state.players[partnerId];

  if (!partner || partner.id === player.id || !partner.alive) {
    return;
  }

  if (!hasActionCard(player, 'TRADE')) {
    return;
  }

  // Note the attempt; the AI plans at most one trade per turn off this flag
  // (nothing restricts the human's seat, matching the original behavior).
  player.tradedThisTurn = true;

  const wantKey = Object.keys(gets)[0];
  if (wantKey && RESOURCE_TYPES.includes(wantKey as never)) {
    log(
      state,
      `📡 ${player.name} opens a trade channel — seeking ${CARDS[wantKey].icon} ${CARDS[wantKey].name}`,
      'trade',
    );
  }
  const humanControlled = partner.isHuman && !AUTO_HUMAN;
  if (humanControlled) {
    setStatus(state, `${player.name} is hailing you with a trade offer…`);
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
    return;
  }
  if (accept) {
    execTrade(cur, cur.players[playerId], cur.players[partnerId], gives, gets);
    return;
  }
  log(
    cur,
    `🔁 ${cur.players[partnerId].name} declines ${cur.players[playerId].name}'s trade offer.`,
    'trade',
  );
}

function execTrade(
  state: GameState,
  a: Player,
  b: Player,
  aGives: Cost,
  bGives: Cost,
): void {
  spendActionCard(a, 'TRADE');
  for (const t in aGives) {
    a.hand[t] -= aGives[t];
    b.hand[t] += aGives[t];
  }
  for (const t in bGives) {
    b.hand[t] -= bGives[t];
    a.hand[t] += bGives[t];
  }
  a.influence++;
  log(
    state,
    `🔁 ${a.name} trades ${fmtCards(aGives)} to ${b.name} for ${fmtCards(bGives)}  [+1⭐ influence]`,
    'trade',
  );
}
