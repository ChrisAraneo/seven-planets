import type { GameState } from '../interfaces/game-state';
import { hasActionCard } from '../functions/has-action-card';
import { recruitCost } from '../functions/recruit-cost';
import { canAfford } from '../config/constants';
import { floatText } from '../hooks';
import { recruitYield } from '../functions/recruit-yield';
import { log } from '../functions/log';
import { payCost } from '../functions/pay-cost';
import { spendActionCard } from '../functions/spend-action-card';
import { getGameState, setGameState } from '../game-state';
import { cloneDeep } from 'lodash-es';

export interface RecruitTroopsPayload {
  playerId: number;
  planetId: number;
}

export async function recruitTroops(
  payload: RecruitTroopsPayload,
): Promise<void> {
  const state = cloneDeep(getGameState());
  const { playerId, planetId } = payload;

  if (playerId !== state.activeId || state.over) {
    return;
  }

  if (!hasActionCard(state.players[playerId], 'RECRUIT')) {
    return;
  }

  f(state, playerId, planetId);

  setGameState(state);
}

// Applies pure engine results onto the private clone via Object.assign so the
// object identity (and the caller's `state` reference) stays stable.
function f(state: GameState, playerId: number, planetId: number): void {
  const planet = state.planets[planetId];
  if (!planet.buildings.BARRACKS) {
    return;
  }

  if (!canAfford(state.players[playerId].hand, recruitCost(planet))) {
    return;
  }

  Object.assign(state, spendActionCard(state, playerId, 'RECRUIT'));
  Object.assign(state, payCost(state, playerId, recruitCost(planet)));

  const n = recruitYield(planet);
  state.planets[planetId].troops += n;
  Object.assign(
    state,
    log(
      state,
      `🪖 ${state.players[playerId].name} recruits ${n} troop${n > 1 ? 's' : ''} on ${planet.name} (garrison now ${state.planets[planetId].troops})`,
      'build',
    ),
  );

  floatText(state.planets[planetId], `+${n}🪖`, '#7fd9ff');
}
