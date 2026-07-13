import { getGameStateLastValue } from '@seven-planets/game';
import {
  COMBAT,
  HOME_FIELD,
  PACIFIST_DEF_BONUS,
  SHIELD_DEFENSE,
} from '@seven-planets/game';
import { singularityDefBonus } from '@seven-planets/game';
import type { Planet } from '@seven-planets/game';

export function defenseBaseOf(planet: Planet, troops = planet.troops): number {
  const pac = getGameStateLastValue().players[planet.ownerId]?.hasPacifistStatus
    ? PACIFIST_DEF_BONUS
    : 0;
  return (
    COMBAT.defensePerTroop * troops +
    (planet.buildings.SHIELD || 0) * SHIELD_DEFENSE +
    pac +
    singularityDefBonus(planet) +
    HOME_FIELD
  );
}
