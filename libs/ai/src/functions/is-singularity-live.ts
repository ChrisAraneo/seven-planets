import {
  ADVANCED_FROM_TURN,
  BUILD_ORDER,
  getMaxLevel,
} from '@seven-planets/game';
import { isSingularityLabOk } from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { owned } from './owned';
import { techLevel } from './tech-level';

export function isSingularityLive(): boolean {
  return getAlivePlayers().some((player) =>
    owned(player).some((planet) => {
      const next = (planet.buildings.SINGULARITY || 0) + 1;
      return (
        next <= getMaxLevel('SINGULARITY') &&
        next <= techLevel(player) &&
        isSingularityLabOk(planet, next)
      );
    }),
  );
}
