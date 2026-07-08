import { CARDS, RESOURCE_TYPES } from '@/game/constants';
import type { Player, TradeOffer } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { aiEvaluateTrade } from './ai-evaluate-trade';
import { askHumanOffer } from './ask-human-offer';
import { AUTO_HUMAN } from './auto-human';
import { execTrade } from './exec-trade';
import { log } from './log';
import { setStatus } from './set-status';

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
  let accept: boolean;
  if (partner.isHuman && !AUTO_HUMAN) {
    setStatus(`${p.name} is hailing you with a trade offer…`);
    accept = await askHumanOffer(p, offer);
  } else {
    accept = aiEvaluateTrade(partner, offer.gets, offer.gives, p);
  }
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
