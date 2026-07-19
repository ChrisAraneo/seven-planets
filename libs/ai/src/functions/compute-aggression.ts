import type { Player } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getAiState } from '../state';

export const computeAggression = (player: Player): number =>
  match(player)
    .with({ hasPacifistStatus: true }, () => 0)
    .with({ isKamikaze: true }, () => 1)
    .otherwise(() => getAiState().weights.willNeutral);
