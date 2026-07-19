import type { Planet, Player } from '@seven-planets/game';
import { computeRecruitableTroops } from '@seven-planets/game';
import { getBuildingLevel } from '@seven-planets/game';

export const canRecruitAt = (player: Player, planet: Planet): boolean =>
  getBuildingLevel(planet, 'BARRACKS') > 0 &&
  computeRecruitableTroops(planet, player.hand) >= 1;
