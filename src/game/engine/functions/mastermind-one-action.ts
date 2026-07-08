import type { GameState, Player } from '@/game/types';
import { mastermindAction } from '@/game/ai/functions/mastermind-action';
import { doAttack } from './do-attack';
import { hasActionCard } from './has-action-card';
import { moveTroops } from './move-troops';
import { proposeTrade } from './propose-trade';
import { recruit } from './recruit';
import { useInfluenceCard } from './use-influence-card';

// Execute one MASTERMIND decision — the brain (./ai) decides, the engine acts.
export async function mastermindOneAction(
  state: GameState,
  p: Player,
): Promise<boolean> {
  const d = mastermindAction(state, p);
  if (!d) {
    return false;
  }
  switch (d.kind) {
    case 'influence': {
      return useInfluenceCard(state, p, d.type, d.opts);
    }
    case 'attack': {
      if (!hasActionCard(p, 'ATTACK')) {
        return false;
      }
      await doAttack(state, p, d.source, d.target, d.n);
      return true;
    }
    case 'recruit': {
      if (!hasActionCard(p, 'RECRUIT')) {
        return false;
      }
      recruit(state, p, d.planet);
      return true;
    }
    case 'move': {
      if (!hasActionCard(p, 'MOVE')) {
        return false;
      }
      await moveTroops(state, p, d.from, d.to, d.n);
      return true;
    }
    case 'trade': {
      if (p.tradedThisTurn || !hasActionCard(p, 'TRADE')) {
        return false;
      }
      p.tradedThisTurn = true;
      return await proposeTrade(state, p, {
        partner: d.partner,
        gives: d.gives,
        gets: d.gets,
      });
    }
  }
  return false;
}
