import { match } from 'ts-pattern';

import { SHIELD_DEFENSE, SHIELD_UNPOWERED_DEFENSE } from '../config/constants';
import type { Planet } from '../interfaces/planet';
import { getBuildingLevel } from './get-building-level';

export const computeShieldDefense = (planet: Planet): number =>
  Math.min(
    SHIELD_DEFENSE[getBuildingLevel(planet, 'SHIELD')],
    match(planet.isShieldUnpowered)
      .with(true, () => SHIELD_UNPOWERED_DEFENSE)
      .otherwise(() => Infinity),
  );
