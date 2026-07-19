import { match } from 'ts-pattern';

import type { Planet } from '../interfaces/planet';
import { bump } from './bump';
import type { IncomeTally } from './do-income';
import { getBuildingLevel } from './extractors/get-building-level';

const EMBASSY_PERK_LEVEL = 2;
const EMBASSY_PERK_INFLUENCE = 1;

export const addEmbassyPerk = (
  tally: IncomeTally,
  ownerId: number,
  planet: Planet,
): IncomeTally =>
  match(getBuildingLevel(planet, 'EMBASSY'))
    .when(
      (level) => level >= EMBASSY_PERK_LEVEL,
      () => ({
        ...tally,
        infAdd: bump(tally.infAdd, ownerId, EMBASSY_PERK_INFLUENCE),
        infGains: bump(tally.infGains, ownerId, EMBASSY_PERK_INFLUENCE),
      }),
    )
    .otherwise(() => tally);
