import type { Player } from '@/game/types';
import { mastermindAction } from '@/game/ai/ai';
import { getState } from '../state';
import { doAttack } from './do-attack';
import { hasActionCard } from './has-action-card';
import { moveTroops } from './move-troops';
import { proposeTrade } from './propose-trade';
import { recruit } from './recruit';
import { useInfluenceCard } from './use-influence-card';

// Execute one MASTERMIND decision — the brain (./ai) decides, the engine acts.
export async function mastermindOneAction(p: Player): Promise<boolean> {
  const d = mastermindAction(getState(), p);
  if (!d) {
    return false;
  }
  switch (d.kind) {
    case 'influence': {
      return useInfluenceCard(p, d.type, d.opts);
    }
    case 'attack': {
      if (!hasActionCard(p, 'ATTACK')) {
        return false;
      }
      await doAttack(p, d.source, d.target, d.n);
      return true;
    }
    case 'recruit': {
      if (!hasActionCard(p, 'RECRUIT')) {
        return false;
      }
      recruit(p, d.planet);
      return true;
    }
    case 'move': {
      if (!hasActionCard(p, 'MOVE')) {
        return false;
      }
      await moveTroops(p, d.from, d.to, d.n);
      return true;
    }
    case 'trade': {
      if (p.tradedThisTurn || !hasActionCard(p, 'TRADE')) {
        return false;
      }
      p.tradedThisTurn = true;
      return await proposeTrade(p, {
        partner: d.partner,
        gives: d.gives,
        gets: d.gets,
      });
    }
  }
}
