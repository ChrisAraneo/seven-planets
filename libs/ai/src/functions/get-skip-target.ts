import type { InfluenceType, Player } from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { getOwnedPlanets } from './get-owned-planets';
import { computeTechLevel } from './compute-tech-level';
import { computeTotalTroops } from './compute-total-troops';

export function getSkipTarget(
  player: Player,
  influenceType: InfluenceType,
): Player | null {
  const rivals = getAlivePlayers().filter((rival) => rival.id !== player.id);
  if (rivals.length === 0) {
    return null;
  }
  if (influenceType === 'SKIP_ARMY') {
    return rivals.reduce((best, rival) =>
      computeTotalTroops(rival) > computeTotalTroops(best) ? rival : best,
    );
  }
  if (influenceType === 'SKIP_PLANETS') {
    return rivals.reduce((best, rival) =>
      getOwnedPlanets(rival).length > getOwnedPlanets(best).length
        ? rival
        : best,
    );
  }
  if (influenceType === 'SKIP_INFLUENCE') {
    return rivals.reduce((best, rival) =>
      rival.influence < best.influence ? rival : best,
    );
  }
  if (influenceType === 'SKIP_TECH') {
    return rivals.reduce((best, rival) =>
      computeTechLevel(rival) > computeTechLevel(best) ? rival : best,
    );
  }
  return null;
}
