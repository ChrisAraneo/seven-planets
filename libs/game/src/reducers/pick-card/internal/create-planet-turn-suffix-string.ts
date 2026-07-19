import { match } from 'ts-pattern';

import type { Planet } from '../../../interfaces/planet';

export const createPlanetTurnSuffixString = (
  planet: Planet,
  slot: number,
): string =>
  match(slot)
    .when(
      (count) => count > 0,
      () => ` (${planet.name}'s turn)`,
    )
    .otherwise(() => '');
