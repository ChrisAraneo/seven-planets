import { match } from 'ts-pattern';

import type { Planet } from '../interfaces/planet';
import { bump } from './bump';
import type { IncomeTally } from './do-income';

export const addEmbassyPerk = (
  tally: IncomeTally,
  ownerId: number,
  planet: Planet,
): IncomeTally =>
  match(planet.buildings.EMBASSY || 0)
    .when(
      (level) => level >= 2,
      () => ({
        ...tally,
        infAdd: bump(tally.infAdd, ownerId, 1),
        infGains: bump(tally.infGains, ownerId, 1),
      }),
    )
    .otherwise(() => tally);
