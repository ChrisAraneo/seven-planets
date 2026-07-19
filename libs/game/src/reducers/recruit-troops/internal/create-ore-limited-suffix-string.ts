import { match } from 'ts-pattern';

import { computeRecruitYield } from '../../../functions/compute-recruit-yield';
import type { Planet } from '../../../interfaces/planet';

export const createOreLimitedSuffixString = (
  planet: Planet,
  count: number,
): string =>
  match(count < computeRecruitYield(planet))
    .with(
      true,
      () => ` (ore-limited, Barracks yields ${computeRecruitYield(planet)})`,
    )
    .otherwise(() => '');
