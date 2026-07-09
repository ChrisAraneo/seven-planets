import type { GameState, Player, Planet } from '@/game/types';
import { hasActionCard } from '../common/has-action-card';
import { recruitCost } from '../common/recruit-cost';
import { canAfford } from '@/game/constants';
import { floatText } from '@/game/hooks';
import { recruitYield } from '@/game/shared/recruit-yield';
import { log } from '../common/log';
import { payCost } from '../common/pay-cost';
import { spendActionCard } from '../common/spend-action-card';

export interface RecruitPayload {
  playerId: number;
  planetId: number;
}

export async function recruit(
  state: GameState,
  payload: RecruitPayload,
): Promise<GameState> {
  const { playerId, planetId } = payload;

  if (playerId !== state.activeId || state.over) {
    return state;
  }

  const player = state.players[playerId];

  if (!hasActionCard(player, 'RECRUIT')) {
    return state;
  }

  f(player, state.planets[planetId]);

  return state;
}

function f(player: Player, planet: Planet): void {
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
    `🪖 ${player.name} recruits ${n} troop${n > 1 ? 's' : ''} on ${planet.name} (garrison now ${planet.troops})`,
    'build',
  );

  floatText(planet, `+${n}🪖`, '#7fd9ff');
}
