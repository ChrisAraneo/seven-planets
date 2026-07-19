import { COMBAT } from '@seven-planets/game';
import { range, sumBy } from 'lodash-es';

import { chain } from '../utils/chain';

export const computeBattleWinProbability = (
  attackBase: number,
  defenseBase: number,
): number =>
  chain(
    sumBy(range(COMBAT.attackRoll + 1), (attackerRoll) =>
      sumBy(range(COMBAT.defenseRoll + 1), (defenderRoll) =>
        Number(attackBase + attackerRoll > defenseBase + defenderRoll),
      ),
    ),
  )
    .thru((wins) => wins / ((COMBAT.attackRoll + 1) * (COMBAT.defenseRoll + 1)))
    .value();
