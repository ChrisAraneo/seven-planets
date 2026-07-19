import { match } from 'ts-pattern';

import { PACIFIST_INFLUENCE } from '../config/constants';
import type { Player } from '../interfaces/player';
import { bump } from './bump';
import type { IncomeTally } from './do-income';

export const addPacifistPerk = (
  tally: IncomeTally,
  owner: Player,
): IncomeTally =>
  match(owner.hasPacifistStatus)
    .with(true, () => ({
      ...tally,
      infAdd: bump(tally.infAdd, owner.id, PACIFIST_INFLUENCE),
      pacGains: bump(tally.pacGains, owner.id, PACIFIST_INFLUENCE),
    }))
    .otherwise(() => tally);
