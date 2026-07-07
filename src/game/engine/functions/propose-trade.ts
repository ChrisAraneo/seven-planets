import { CARDS, RESOURCE_TYPES } from '@/game/constants';
import { AUTO_HUMAN } from './auto-human';
import { log } from './log';
import { setStatus } from './set-status';
import type { Player, TradeOffer } from '@/game/types';
import { getState } from '../state';
import { aiEvaluateTrade } from './ai-evaluate-trade';
import { askHumanOffer } from './ask-human-offer';
import { execTrade } from './exec-trade';

export async function proposeTrade(
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
  let accept: boolean;
  if (partner.isHuman && !AUTO_HUMAN) {
    setStatus(`${p.name} is hailing you with a trade offer…`);
    accept = await askHumanOffer(p, offer);
  } else {
    accept = aiEvaluateTrade(partner, offer.gets, offer.gives, p);
  }
  if (getState().over) {
    return false;
  }
  if (accept) {
    execTrade(p, partner, offer.gives, offer.gets);
    return true;
  }
  log(`🔁 ${partner.name} declines ${p.name}'s trade offer.`, 'trade');
  return false;
}
