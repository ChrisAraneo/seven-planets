import { getGameState } from '@seven-planets/game';
import {
  COMBAT,
  HOME_FIELD,
  PACIFIST_DEF_BONUS,
  SHIELD_DEFENSE,
} from '@seven-planets/game';
import { singularityDefBonus } from '@seven-planets/game';
import type { Planet } from '@seven-planets/game';

export function defenseBaseOf(pl: Planet, troops = pl.troops): number {
  const pac = getGameState().players[pl.ownerId]?.hasPacifistStatus
    ? PACIFIST_DEF_BONUS
    : 0;
  return (
    COMBAT.defensePerTroop * troops +
    (pl.buildings.SHIELD || 0) * SHIELD_DEFENSE +
    pac +
    singularityDefBonus(pl) +
    HOME_FIELD
  );
}
