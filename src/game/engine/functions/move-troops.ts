import { animateRocket, floatText } from '@/game/effects';
import type { Planet, Player } from '@/game/types';
import { hasBuilding } from './has-building';
import { log } from './log';
import { spendActionCard } from './spend-action-card';

// Redeploy troops between two planets of the same player (spends a Move card).
export async function moveTroops(
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
