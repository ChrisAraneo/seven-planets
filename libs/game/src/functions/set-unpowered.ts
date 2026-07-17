import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import { updatePlanet } from './update-planet';

export const setUnpowered = (
  state: GameState,
  planet: Planet,
  unpowered: boolean,
): GameState =>
  match(planet.isShieldUnpowered === unpowered)
    .with(true, () => state)
    .otherwise(() =>
      updatePlanet(state, planet.id, (current) => ({
        ...current,
        isShieldUnpowered: unpowered,
      })),
    );
