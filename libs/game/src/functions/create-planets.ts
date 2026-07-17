import type { Planet } from '../interfaces/planet';
import type { SeatDefinition } from './create-initial-game-state';

export const createPlanets = (gameDefs: SeatDefinition[]): Planet[] =>
  gameDefs.map((definition, index) => ({
    id: index,
    name: definition.planet,
    ownerId: index,
    buildings: {},
    troops: 3,
    protectedUntil: 0,
    isShieldUnpowered: false,
    x: 0,
    y: 0,
    r: 30,
    styleIdx: definition.styleIdx,
  }));
