import { COMBAT } from '@seven-planets/game';
import { match } from 'ts-pattern';

export const computeMinimumTroopsToConquer = (defenderTroops: number): number =>
  match(defenderTroops)
    .when(
      (candidate) => candidate <= 0,
      () => 1,
    )
    .otherwise(
      (candidate) =>
        Math.floor(
          ((candidate - 1) * COMBAT.winDefLoss.den) / COMBAT.winDefLoss.num,
        ) + 1,
    );
