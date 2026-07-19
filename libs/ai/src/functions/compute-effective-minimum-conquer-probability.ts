import type { Player } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { getAiState } from '../state';
import { chain } from '../utils/chain';
import { KAMIKAZE_MIN_CONQUER_FLOOR, KAMIKAZE_RISK } from './ai-constants';

const toDuelBonus = (): number =>
  match(getAlivePlayers().length)
    .with(2, () => 0.1)
    .otherwise(() => 0);

const toRecklessBonus = (player: Player | undefined): number =>
  match(player?.isKamikaze)
    .with(true, () => KAMIKAZE_RISK)
    .otherwise(() => 0);

const toConquerFloor = (player: Player | undefined): number =>
  match(player?.isKamikaze)
    .with(true, () => KAMIKAZE_MIN_CONQUER_FLOOR)
    .otherwise(() => 0.25);

export const computeEffectiveMinimumConquerProbability = (
  player?: Player,
): number =>
  chain(getAiState())
    .thru(
      (aiState) =>
        aiState.weights.minConquerProb -
        getTurn() * aiState.weights.aggressionRamp -
        toDuelBonus() -
        toRecklessBonus(player),
    )
    .thru((rampedProbability) =>
      Math.max(toConquerFloor(player), rampedProbability),
    )
    .value();
