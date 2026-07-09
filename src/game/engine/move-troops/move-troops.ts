import { hasActionCard } from '../common/has-action-card';
import { setBusy } from '../common/set-busy';
import type { GameState, Planet, Player } from '@/game/types';
import { animateRocket, floatText } from '@/game/hooks';
import { hasBuilding } from '../common/has-building';
import { log } from '../common/log';
import { spendActionCard } from '../common/spend-action-card';

export interface MoveTroopsPayload {
  playerId: number;
  fromId: number;
  toId: number;
  n: number;
}

export async function moveTroops(
  state: GameState,
  payload: MoveTroopsPayload,
): Promise<GameState> {
  const { playerId, fromId, toId, n } = payload;

  if (playerId !== state.activeId || state.over) {
    return state;
  }

  const p = state.players[playerId];

  if (!hasActionCard(p, 'MOVE')) {
    return state;
  }

  setBusy(state, true);

  try {
    await f(p, state.planets[fromId], state.planets[toId], n);
  } finally {
    setBusy(state, false);
  }

  return state;
}

async function f(
  p: Player,
  from: Planet,
  to: Planet,
  n: number,
): Promise<void> {
  if (!hasBuilding(p, 'SPACEPORT')) {
    return;
  }

  spendActionCard(p, 'MOVE');

  from.troops -= n;

  log(
    `🛸 ${p.name} redeploys ${n} troop${n > 1 ? 's' : ''} from ${from.name} to ${to.name}`,
    'build',
  );

  await animateRocket(from, to, p.color);

  to.troops += n;

  floatText(to, `+${n}🪖`, '#7fd9ff');
}
