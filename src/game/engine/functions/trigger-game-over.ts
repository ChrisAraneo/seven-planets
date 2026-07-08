import type { GameState, Player } from '@/game/types';
import { endHumanTurn } from './end-human-turn';
import { log } from './log';
import { resolveOffer } from './resolve-offer';
import { getPoolResolve, setPoolResolve } from './resolver-state';
import { setStatus } from './set-status';

export function triggerGameOver(
  state: GameState,
  winner: Player | null,
  reason: 'conquest' | 'eliminated',
): void {
  if (state.over) {
    return;
  }
  state.over = { winner, reason };
  if (reason === 'conquest' && winner) {
    log(
      state,
      `🏴 ${winner.name} rules all seven planets! The galaxy has one master.`,
      'win',
    );
  }
  if (reason === 'eliminated') {
    log(
      state,
      '☠️ Your homeworld has fallen. The galaxy forgets Terra Prime.',
      'win',
    );
  }
  setStatus(
    state,
    winner
      ? `GAME OVER — ${winner.name} wins by ${reason}.`
      : 'GAME OVER — your homeworld has fallen.',
  );
  endHumanTurn(state);
  const r = getPoolResolve();
  if (r) {
    setPoolResolve(null);
    state.awaitingPick = false;
    r(0);
  }
  if (state.pendingOffer) {
    resolveOffer(state, false);
  }
}
