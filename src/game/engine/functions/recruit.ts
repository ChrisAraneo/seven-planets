import { canAfford } from '@/game/constants';
import { floatText } from '@/game/hooks';
import { recruitYield } from '@/game/shared/recruit-yield';
import type { Planet, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { log } from './log';
import { payCost } from './pay-cost';
import { recruitCost } from './recruit-cost';
import { spendActionCard } from './spend-action-card';

// Recruiting REQUIRES a Barracks on the target planet.
export function recruit(p: Player, planet: Planet): void {
  const state = getGameState();
  if (!planet.buildings.BARRACKS) {
    return;
  } // No barracks, no army
  if (!canAfford(p.hand, recruitCost(planet))) {
    return;
  }
  spendActionCard(p, 'RECRUIT');
  payCost(p, recruitCost(planet));
  const n = recruitYield(planet);
  planet.troops += n;
  log(
    `🪖 ${p.name} recruits ${n} troop${n > 1 ? 's' : ''} on ${planet.name} (garrison now ${planet.troops})`,
    'build',
  );
  floatText(planet, `+${n}🪖`, '#7fd9ff');
}
