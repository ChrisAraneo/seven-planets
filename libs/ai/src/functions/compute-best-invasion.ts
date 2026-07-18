import type { Planet, Player } from '@seven-planets/game';
import { getGameStateLastValue } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { nullish } from '../utils/p';
import type { InvasionPlan } from './score-invasion';
import { scoreInvasion } from './score-invasion';

export const computeBestInvasion = (
  player: Player,
  staging: Planet | null,
  tempo: number,
): InvasionPlan | null =>
  getGameStateLastValue().planets.reduce<InvasionPlan | null>(
    (best, target) =>
      match(scoreInvasion(player, target, staging, tempo))
        .with(nullish, () => best)
        .when(
          (candidate) => candidate.score > (best?.score ?? 0),
          (candidate) => candidate,
        )
        .otherwise(() => best),
    null,
  );
