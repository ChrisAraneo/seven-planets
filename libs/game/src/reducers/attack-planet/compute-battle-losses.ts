import { match } from 'ts-pattern';

import { COMBAT } from '../../config/constants';

export const computeBattleLosses = (
  didWin: boolean,
  troops: number,
  targetTroops: number,
): { attLoss: number; defLoss: number } =>
  match(didWin)
    .with(true, () => ({
      defLoss: Math.min(
        targetTroops,
        Math.ceil((troops * COMBAT.winDefLoss.num) / COMBAT.winDefLoss.den),
      ),
      attLoss: Math.floor(
        (troops * COMBAT.winAttLoss.num) / COMBAT.winAttLoss.den,
      ),
    }))
    .otherwise(() => ({
      attLoss: Math.ceil(
        (troops * COMBAT.loseAttLoss.num) / COMBAT.loseAttLoss.den,
      ),
      defLoss: Math.min(
        targetTroops,
        Math.floor((troops * COMBAT.loseDefLoss.num) / COMBAT.loseDefLoss.den),
      ),
    }));
