import { match } from 'ts-pattern';

import type { Planet } from '../interfaces/planet';
import { bump } from './bump';
import { bumpNested } from './bump-nested';
import type { IncomeTally } from './do-income';

const SPACEPORT_MOVE_PERIOD = 3;
export const addSpaceportPerk = (
  tally: IncomeTally,
  turn: number,
  ownerId: number,
  planet: Planet,
): IncomeTally =>
  match(planet.buildings.SPACEPORT || 0)
    .when(
      (level) => level >= 2 && turn % SPACEPORT_MOVE_PERIOD === 0,
      () => ({
        ...tally,
        handAdd: bumpNested(tally.handAdd, ownerId, 'MOVE', 1),
        moveGains: bump(tally.moveGains, ownerId, 1),
      }),
    )
    .otherwise(() => tally);
