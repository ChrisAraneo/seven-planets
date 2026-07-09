import type { Cost, GameState, Player, TradeOffer } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { fmtCards, RESOURCE_TYPES, CARDS } from '@/game/config/constants';
import { setStatus } from '../../functions/set-status';
import { getPlayerAgent } from '../../functions/agent';
import { AUTO_HUMAN } from '../../functions/auto-human';
import { hasActionCard } from '../../functions/has-action-card';
import { log } from '../../functions/log';
import { setOfferResolve } from '../../functions/resolver-state';
import { spendActionCard } from '../../functions/spend-action-card';
import type { GameModuleState } from '../../game';
import { cloneDeep } from 'lodash-es';

export interface MakeOfferPayload {
  playerId: number;
  partnerId: number;
  gives: Cost;
  gets: Cost;
}

export async function makeOffer(
  moduleState: GameModuleState,
  payload: MakeOfferPayload,
): Promise<void> {
  const state = cloneDeep(moduleState.state);
  const { playerId, partnerId, gives, gets } = payload;

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

  await f(state, player, { partner, gives, gets });

  moduleState.state = state;
}

async function f(
  state: GameState,
  p: Player,
  offer: TradeOffer,
): Promise<void> {
  const { partner } = offer;
  const wantKey = Object.keys(offer.gets)[0];
  if (wantKey && RESOURCE_TYPES.includes(wantKey as never)) {
    log(
      state,
      `📡 ${p.name} opens a trade channel — seeking ${CARDS[wantKey].icon} ${CARDS[wantKey].name}`,
      'trade',
    );
  }
  // Every partner seat answers through the same parked `resolveOffer` store
  // Action — the human via the TradeOfferModal, any other seat via the agent.
  const humanControlled = partner.isHuman && !AUTO_HUMAN;
  if (humanControlled) {
    setStatus(state, `${p.name} is hailing you with a trade offer…`);
  }
  const pending = waitOffer(state, p, offer);
  if (!humanControlled) {
    getPlayerAgent().considerOffer(partner);
  }
  const accept = await pending;
  if (state.over) {
    return;
  }
  if (accept) {
    execTrade(state, p, partner, offer.gives, offer.gets);
    return;
  }
  log(state, `🔁 ${partner.name} declines ${p.name}'s trade offer.`, 'trade');
  return;
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

function waitOffer(
  state: GameState,
  from: Player,
  offer: TradeOffer,
): Promise<boolean> {
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
