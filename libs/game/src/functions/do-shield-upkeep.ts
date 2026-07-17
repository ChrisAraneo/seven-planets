import { match } from 'ts-pattern';

import {
  SHIELD_UNPOWERED_DEFENSE,
  SHIELD_UPKEEP_CRYSTAL,
  SHIELD_UPKEEP_LEVEL,
} from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import { log } from './log';
import { updatePlanet } from './update-planet';
import { updatePlayer } from './update-player';

export function doShieldUpkeep(state: GameState): GameState {
  return state.planets.reduce(
    (acc, planet) => settleShield(acc, planet.id),
    state,
  );
}

function settleShield(state: GameState, planetId: number): GameState {
  return match({
    planet: state.planets[planetId],
    owner: state.players[state.planets[planetId].ownerId],
  })
    .when(
      ({ planet, owner }) =>
        (planet.buildings.SHIELD || 0) < SHIELD_UPKEEP_LEVEL || !owner.isAlive,
      ({ planet }) => setUnpowered(state, planet, false),
    )
    .when(
      ({ owner }) => (owner.hand.CRYSTAL || 0) >= SHIELD_UPKEEP_CRYSTAL,
      ({ planet, owner }) =>
        setUnpowered(payUpkeep(state, owner.id), planet, false),
    )
    .otherwise(({ planet, owner }) =>
      log(
        setUnpowered(state, planet, true),
        `🛡️ ${owner.name}'s L3 shield on ${planet.name} runs UNPOWERED — no ${SHIELD_UPKEEP_CRYSTAL}💎 upkeep, only +${SHIELD_UNPOWERED_DEFENSE} defense this turn`,
        'sys',
      ),
    );
}

function payUpkeep(state: GameState, ownerId: number): GameState {
  return updatePlayer(state, ownerId, (player) => ({
    ...player,
    hand: {
      ...player.hand,
      CRYSTAL: (player.hand.CRYSTAL || 0) - SHIELD_UPKEEP_CRYSTAL,
    },
  }));
}

function setUnpowered(
  state: GameState,
  planet: Planet,
  unpowered: boolean,
): GameState {
  return match(planet.isShieldUnpowered === unpowered)
    .with(true, () => state)
    .otherwise(() =>
      updatePlanet(state, planet.id, (current) => ({
        ...current,
        isShieldUnpowered: unpowered,
      })),
    );
}
