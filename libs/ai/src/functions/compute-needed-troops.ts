import type { Planet, Player } from '@seven-planets/game';
import { COMBAT, HOME_FIELD, PACIFIST_DEF_BONUS } from '@seven-planets/game';
import { computeShieldDefense } from '@seven-planets/game';
import { computeSingularityDefenseBonus } from '@seven-planets/game';
import { range } from 'lodash-es';
import { match } from 'ts-pattern';

import { chain } from '../utils/chain';
import { computeBattleWinProbability } from './compute-battle-win-probability';
import { computeEffectiveMinimumConquerProbability } from './compute-effective-minimum-conquer-probability';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { computeRecruitRate } from './compute-recruit-rate';

export const computeNeededTroops = (
  target: Planet,
  defenderOwner: Player,
  stagingBonus: number,
): number =>
  chain(Math.round(target.troops + computeRecruitRate(defenderOwner) * 3))
    .thru((futureDefenders) => ({
      futureDefenders,
      defenseBase:
        COMBAT.defensePerTroop * futureDefenders +
        computeShieldDefense(target) +
        match(defenderOwner.hasPacifistStatus)
          .with(true, () => PACIFIST_DEF_BONUS)
          .otherwise(() => 0) +
        computeSingularityDefenseBonus(target) +
        HOME_FIELD,
    }))
    .thru(({ futureDefenders, defenseBase }) =>
      chain(computeMinimumTroopsToConquer(futureDefenders))
        .thru(
          (minimumTroops) =>
            range(minimumTroops, 80).find(
              (candidate) =>
                computeBattleWinProbability(
                  COMBAT.attackPerTroop * candidate + stagingBonus,
                  defenseBase,
                ) >= computeEffectiveMinimumConquerProbability(),
            ) ?? Math.max(minimumTroops, 80),
        )
        .value(),
    )
    .value();
