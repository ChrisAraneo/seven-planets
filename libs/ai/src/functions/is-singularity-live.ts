import { ADVANCED_FROM_TURN, BUILD_ORDER, maxLevel } from '@seven-planets/game';
import { isSingularityLabOk } from '@seven-planets/game';

import { alive } from './alive';
import { owned } from './owned';
import { techLevel } from './tech-level';

export function isSingularityLive(): boolean {
  return alive().some((player) =>
    owned(player).some((planet) => {
      const next = (planet.buildings.SINGULARITY || 0) + 1;
      return (
        next <= maxLevel('SINGULARITY') &&
        next <= techLevel(player) &&
        isSingularityLabOk(planet, next)
      );
    }),
  );
}
