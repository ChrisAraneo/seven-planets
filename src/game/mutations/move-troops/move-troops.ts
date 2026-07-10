import { hasActionCard } from '../../functions/has-action-card';
import { setBusy } from '../../functions/set-busy';
import type { GameState, Planet, Player } from '@/game/types';
import { animateRocket, floatText } from '@/game/hooks';
import { hasBuilding } from '../../functions/has-building';
import { log } from '../../functions/log';
import { spendActionCard } from '../../functions/spend-action-card';
import type { GameModuleState } from '../../game';
import { cloneDeep } from 'lodash-es';

export interface MoveTroopsPayload {
  playerId: number;
  fromId: number;
  toId: number;
  n: number;
}

export async function moveTroops(
  moduleState: GameModuleState,
  payload: MoveTroopsPayload,
): Promise<void> {
  const state = cloneDeep(moduleState.state);
  const { playerId, fromId, toId, n } = payload;

  if (playerId !== state.activeId || state.over) {
    return;
  }

  const p = state.players[playerId];

  if (!hasActionCard(p, 'MOVE')) {
    return;
  }

  setBusy(state, true);

  try {
    await f(state, p, state.planets[fromId], state.planets[toId], n);
  } finally {
    setBusy(state, false);
  }

  moduleState.state = state;
}

async function f(
  state: GameState,
  p: Player,
  from: Planet,
  to: Planet,
  n: number,
): Promise<void> {
  if (!hasBuilding(state, p, 'SPACEPORT')) {
    return;
  }

  spendActionCard(p, 'MOVE');

  from.troops -= n;

  log(
    state,
    `🛸 ${p.name} redeploys ${n} troop${n > 1 ? 's' : ''} from ${from.name} to ${to.name}`,
    'build',
  );

  await animateRocket(from, to, p.color);

  to.troops += n;

  floatText(to, `+${n}🪖`, '#7fd9ff');
}
