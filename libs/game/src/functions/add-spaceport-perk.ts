import { match } from 'ts-pattern';

import type { Planet } from '../interfaces/planet';
import { bump } from './bump';
import { bumpNested } from './bump-nested';
import type { IncomeTally } from './do-income';
import { getBuildingLevel } from './get-building-level';

const SPACEPORT_MOVE_PERIOD = 3;
const SPACEPORT_PERK_LEVEL = 2;
const SPACEPORT_PERK_MOVE_CARDS = 1;
export const addSpaceportPerk = (
  tally: IncomeTally,
  turn: number,
  ownerId: number,
  planet: Planet,
): IncomeTally =>
  match(getBuildingLevel(planet, 'SPACEPORT'))
    .when(
      (level) =>
        level >= SPACEPORT_PERK_LEVEL && turn % SPACEPORT_MOVE_PERIOD === 0,
      () => ({
        ...tally,
        handAdd: bumpNested(
          tally.handAdd,
          ownerId,
          'MOVE',
          SPACEPORT_PERK_MOVE_CARDS,
        ),
        moveGains: bump(tally.moveGains, ownerId, SPACEPORT_PERK_MOVE_CARDS),
      }),
    )
    .otherwise(() => tally);
