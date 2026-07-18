import type { Planet, Player } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getAiState } from '../state';
import { nullish } from '../utils/p';
import { computeRecruitRate } from './compute-recruit-rate';

export const computeTurnsToStage = (
  player: Player,
  staging: Planet | null,
  neededTroops: number,
): number =>
  Math.max(
    0,
    Math.ceil(
      (neededTroops + getAiState().W.reserveTroops - (staging?.troops ?? 0)) /
        Math.max(0.4, computeRecruitRate(player)),
    ),
  ) +
  match(staging)
    .with(nullish, () => 4)
    .otherwise(() => 0);
