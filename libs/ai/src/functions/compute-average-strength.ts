import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { chain } from '../utils/chain';
import { computePlayerStrength } from './compute-player-strength';

export const computeAverageStrength = (): number =>
  chain(getAlivePlayers())
    .map((player) => computePlayerStrength(player))
    .thru(
      (strengths) =>
        strengths.reduce((sum, strength) => sum + strength, 0) /
        Math.max(strengths.length, 1),
    )
    .value();
