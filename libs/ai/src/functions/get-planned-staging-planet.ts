import type { Planet, Player } from '@seven-planets/game';
import { getGameStateLastValue } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { nullish } from '../utils/p';
import { getPlan } from './get-plan';

export const getPlannedStagingPlanet = (player: Player): Planet | null =>
  match(getPlan(player).stagingId)
    .with(nullish, () => null)
    .otherwise((stagingId) => getGameStateLastValue().planets[stagingId]);
