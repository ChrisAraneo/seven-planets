import type { Planet } from '@seven-planets/game';
import { COMBAT, HOME_FIELD, PACIFIST_DEF_BONUS } from '@seven-planets/game';
import { computeShieldDefense } from '@seven-planets/game';
import { computeSingularityDefenseBonus } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';

const toPacifistBonus = (planet: Planet): number =>
  match(getPlayerByIndex(planet.ownerId)?.hasPacifistStatus)
    .with(true, () => PACIFIST_DEF_BONUS)
    .otherwise(() => 0);

export const computeDefenseBase = (
  planet: Planet,
  troops = planet.troops,
): number =>
  COMBAT.defensePerTroop * troops +
  computeShieldDefense(planet) +
  toPacifistBonus(planet) +
  computeSingularityDefenseBonus(planet) +
  HOME_FIELD;
