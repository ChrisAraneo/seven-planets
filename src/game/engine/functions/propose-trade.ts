import { CARDS, RESOURCE_TYPES } from '@/game/constants';
import { AUTO_HUMAN } from './auto-human';
import { log } from './log';
import { setStatus } from './set-status';
import type { GameState, Player, TradeOffer } from '@/game/types';
import { aiEvaluateTrade } from './ai-evaluate-trade';
import { askHumanOffer } from './ask-human-offer';
import { execTrade } from './exec-trade';

export async function proposeTrade(
  state: GameState,
  p: Player,
  offer: TradeOffer,
): Promise<boolean> {
  const { partner } = offer;
  const wantKey = Object.keys(offer.gets)[0];
  if (wantKey && RESOURCE_TYPES.includes(wantKey as never)) {
    log(
      state,
      `📡 ${p.name} opens a trade channel — seeking ${CARDS[wantKey].icon} ${CARDS[wantKey].name}`,
      'trade',
    );
  }
  let accept: boolean;
  if (partner.isHuman && !AUTO_HUMAN) {
    setStatus(state, `${p.name} is hailing you with a trade offer…`);
    accept = await askHumanOffer(state, p, offer);
  } else {
    accept = aiEvaluateTrade(state, partner, offer.gets, offer.gives, p);
  }
  if (state.over) {
    return false;
  }
  if (accept) {
    execTrade(state, p, partner, offer.gives, offer.gets);
    return true;
  }
  log(state, `🔁 ${partner.name} declines ${p.name}'s trade offer.`, 'trade');
  return false;
}
