import { CARDS, RESOURCE_TYPES } from '@/game/constants';
import { getPlayerAgent } from '@/game/engine/agent';
import type { Player, TradeOffer } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { AUTO_HUMAN } from './auto-human';
import { execTrade } from './exec-trade';
import { log } from './log';
import { setStatus } from './set-status';
import { waitOffer } from './wait-offer';

export async function proposeTrade(
  p: Player,
  offer: TradeOffer,
): Promise<boolean> {
  const state = getGameState();
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
