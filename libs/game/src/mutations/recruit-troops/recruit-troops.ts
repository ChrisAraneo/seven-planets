import type { GameState } from '../../interfaces/game-state';
import type { Player } from '../../interfaces/player';
import type { Planet } from '../../interfaces/planet';
import { hasActionCard } from '../../functions/has-action-card';
import { recruitCost } from '../../functions/recruit-cost';
import { canAfford } from '../../config/constants';
import { floatText } from '../../hooks';
import { recruitYield } from '../../functions/recruit-yield';
import { log } from '../../functions/log';
import { payCost } from '../../functions/pay-cost';
import { spendActionCard } from '../../functions/spend-action-card';
import type { GameModuleState } from '../../game';
import { cloneDeep } from 'lodash-es';

export interface RecruitTroopsPayload {
  playerId: number;
  planetId: number;
}

export async function recruitTroops(
  moduleState: GameModuleState,
  payload: RecruitTroopsPayload,
): Promise<void> {
  const state = cloneDeep(moduleState.state);
  const { playerId, planetId } = payload;

  if (playerId !== state.activeId || state.over) {
    return;
  }

  const player = state.players[playerId];

  if (!hasActionCard(player, 'RECRUIT')) {
    return;
  }

  f(state, player, state.planets[planetId]);

  moduleState.state = state;
}

function f(state: GameState, player: Player, planet: Planet): void {
  if (!planet.buildings.BARRACKS) {
    return;
  }

  if (!canAfford(player.hand, recruitCost(planet))) {
    return;
  }

  spendActionCard(player, 'RECRUIT');
  payCost(player, recruitCost(planet));

  const n = recruitYield(planet);
  planet.troops += n;
  log(
    state,
    `🪖 ${player.name} recruits ${n} troop${n > 1 ? 's' : ''} on ${planet.name} (garrison now ${planet.troops})`,
    'build',
  );

  floatText(planet, `+${n}🪖`, '#7fd9ff');
}
