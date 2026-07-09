import type { Cost, GameState, Player, TradeOffer } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { hasActionCard } from '../common/has-action-card';
import { spendActionCard } from '../common/spend-action-card';
import { fmtCards, RESOURCE_TYPES, CARDS } from '@/game/constants';
import { getPlayerAgent } from '../agent';
import { AUTO_HUMAN } from '../common/auto-human';
import { log } from '../common/log';
import { setStatus } from '../common/set-status';
import { setOfferResolve } from '../common/resolver-state';

export interface MakeOfferPayload {
  playerId: number;
  partnerId: number;
  gives: Cost;
  gets: Cost;
}

/* The `trade` store action: propose a resource trade to another player.
   The human's TradeModal and the AI agent both dispatch this; the engine
   then asks the partner seat (human modal or AI agent) to answer via
   `resolveOffer`. Resolves with the partner's acceptance. */
export async function makeOffer(
  state: GameState,
  payload: MakeOfferPayload,
): Promise<boolean> {
  const { playerId, partnerId, gives, gets } = payload;

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

  return f(state, player, { partner, gives, gets });
}

async function f(
  state: GameState,
  p: Player,
  offer: TradeOffer,
): Promise<boolean> {
  const { partner } = offer;
  const wantKey = Object.keys(offer.gets)[0];
  if (wantKey && RESOURCE_TYPES.includes(wantKey as never)) {
    log(
      `📡 ${p.name} opens a trade channel — seeking ${CARDS[wantKey].icon} ${CARDS[wantKey].name}`,
      'trade',
    );
  }
  // Every partner seat answers through the same parked `resolveOffer` store
  // Action — the human via the TradeOfferModal, any other seat via the agent.
  const humanControlled = partner.isHuman && !AUTO_HUMAN;
  if (humanControlled) {
    setStatus(`${p.name} is hailing you with a trade offer…`);
  }
  const pending = waitOffer(p, offer);
  if (!humanControlled) {
    getPlayerAgent().considerOffer(partner);
  }
  const accept = await pending;
  if (state.over) {
    return false;
  }
  if (accept) {
    execTrade(p, partner, offer.gives, offer.gets);
    return true;
  }
  log(`🔁 ${partner.name} declines ${p.name}'s trade offer.`, 'trade');
  return false;
}

function execTrade(a: Player, b: Player, aGives: Cost, bGives: Cost): void {
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
    `🔁 ${a.name} trades ${fmtCards(aGives)} to ${b.name} for ${fmtCards(bGives)}  [+1⭐ influence]`,
    'trade',
  );
}

function waitOffer(from: Player, offer: TradeOffer): Promise<boolean> {
  const state = getGameState();
  return new Promise((res) => {
    setOfferResolve(res);
    state.pendingOffer = {
      fromId: from.id,
      toId: offer.partner.id,
      gives: offer.gives,
      gets: offer.gets,
    };
  });
}
