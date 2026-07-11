import { hasActionCard } from '../functions/has-action-card';
import { setBusy } from '../functions/set-busy';
import type { GameState } from '../interfaces/game-state';
import { hasBuilding } from '../functions/has-building';
import { log } from '../functions/log';
import { spendActionCard } from '../functions/spend-action-card';
import { getGameState, setGameState } from '../game-state';
import { cloneDeep } from 'lodash-es';
import { NO_PRESENTATION } from '../config/constants';
import type { PresentationHooks } from '../interfaces/presentation-hooks';

export interface MoveTroopsPayload {
  playerId: number;
  fromId: number;
  toId: number;
  n: number;
}

export async function moveTroops(
  payload: MoveTroopsPayload,
  hooks: PresentationHooks = NO_PRESENTATION,
): Promise<void> {
  const state = cloneDeep(getGameState());
  const { playerId, fromId, toId, n } = payload;

  if (playerId !== state.activeId || state.over) {
    return;
  }

  if (!hasActionCard(state.players[playerId], 'MOVE')) {
    return;
  }

  Object.assign(state, setBusy(state, true));

  try {
    await f(state, playerId, fromId, toId, n, hooks);
  } finally {
    Object.assign(state, setBusy(state, false));
  }

  setGameState(state);
}

async function f(
  state: GameState,
  playerId: number,
  fromId: number,
  toId: number,
  n: number,
  hooks: PresentationHooks,
): Promise<void> {
  if (!hasBuilding(state, state.players[playerId], 'SPACEPORT')) {
    return;
  }

  Object.assign(state, spendActionCard(state, playerId, 'MOVE'));

  state.planets[fromId].troops -= n;

  Object.assign(
    state,
    log(
      state,
      `🛸 ${state.players[playerId].name} redeploys ${n} troop${n > 1 ? 's' : ''} from ${state.planets[fromId].name} to ${state.planets[toId].name}`,
      'build',
    ),
  );

  await hooks.rocket(
    state.planets[fromId],
    state.planets[toId],
    state.players[playerId].color,
  );

  state.planets[toId].troops += n;

  hooks.floatText(state.planets[toId], `+${n}🪖`, '#7fd9ff');
}
