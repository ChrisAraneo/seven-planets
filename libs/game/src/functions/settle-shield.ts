import { match } from 'ts-pattern';

import {
  SHIELD_UNPOWERED_DEFENSE,
  SHIELD_UPKEEP_CRYSTAL,
  SHIELD_UPKEEP_LEVEL,
} from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import { log } from './log';
import { payUpkeep } from './pay-upkeep';
import { setUnpowered } from './set-unpowered';

export const settleShield = (state: GameState, planetId: number): GameState =>
  match({
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
