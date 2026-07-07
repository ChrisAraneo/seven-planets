import { canAfford } from '@/game/constants';
import { floatText } from '@/game/effects';
import type { Planet, Player } from '@/game/types';
import { log } from './log';
import { payCost } from './pay-cost';
import { recruitCost } from './recruit-cost';
import { recruitYield } from '@/game/shared/recruit-yield';
import { spendActionCard } from './spend-action-card';

// Recruiting REQUIRES a Barracks on the target planet.
export function recruit(p: Player, planet: Planet): void {
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
