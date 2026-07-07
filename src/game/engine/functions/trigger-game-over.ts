import type { Player } from '@/game/types';
import { getState } from '../state';
import { endHumanTurn } from './end-human-turn';
import { log } from './log';
import { resolveOffer } from './resolve-offer';
import { getPoolResolve, setPoolResolve } from './resolver-state';
import { setStatus } from './set-status';

export function triggerGameOver(
  winner: Player | null,
  reason: 'conquest' | 'eliminated',
): void {
  if (getState().over) {
    return;
  }
  getState().over = { winner, reason };
  if (reason === 'conquest' && winner) {
    log(
      `🏴 ${winner.name} rules all seven planets! The galaxy has one master.`,
      'win',
    );
  }
  if (reason === 'eliminated') {
    log('☠️ Your homeworld has fallen. The galaxy forgets Terra Prime.', 'win');
  }
  setStatus(
    winner
      ? `GAME OVER — ${winner.name} wins by ${reason}.`
      : 'GAME OVER — your homeworld has fallen.',
  );
  endHumanTurn();
  const r = getPoolResolve();
  if (r) {
    setPoolResolve(null);
    getState().awaitingPick = false;
    r(0);
  }
  if (getState().pendingOffer) {
    resolveOffer(false);
  }
}
