import type { Planet, Player } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { CONQUEST_TRUCE } from '@seven-planets/game';
import { getBuildingLevel } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';
import { getAiState } from '../state';
import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { canTarget } from './can-target';
import { computeHoldProbability } from './compute-hold-probability';
import { computeNeededTroops } from './compute-needed-troops';
import { computePlanetValue } from './compute-planet-value';
import { computeSurvivorsAfterWin } from './compute-survivors-after-win';
import { computeTurnsToStage } from './compute-turns-to-stage';
import { getOwnedPlanets } from './get-owned-planets';

export interface InvasionPlan {
  score: number;
  targetId: number;
  troopsNeeded: number;
}

const buildInvasionPlan = (
  player: Player,
  target: Planet,
  defenderOwner: Player,
  staging: Planet | null,
  neededTroops: number,
  tempo: number,
): InvasionPlan | null =>
  match(computeTurnsToStage(player, staging, neededTroops))
    .when(
      (turnsToStage) => turnsToStage > getAiState().W.planHorizon + 4,
      () => null,
    )
    .otherwise((turnsToStage) => ({
      score:
        ((computePlanetValue(target) +
          match(getOwnedPlanets(defenderOwner).length)
            .with(1, () => 10)
            .otherwise(() => 0)) *
          0.75 *
          computeHoldProbability(
            player,
            target,
            computeSurvivorsAfterWin(neededTroops),
            getTurn() + CONQUEST_TRUCE,
          ) *
          0.9 ** turnsToStage -
          neededTroops * getAiState().W.troopValue * 0.3) *
        tempo,
      targetId: target.id,
      troopsNeeded: neededTroops + getAiState().W.reserveTroops,
    }));

export const scoreInvasion = (
  player: Player,
  target: Planet,
  staging: Planet | null,
  tempo: number,
): InvasionPlan | null =>
  match(getPlayerByIndex(target.ownerId))
    .with(nullish, () => null)
    .when(
      (defenderOwner) =>
        target.ownerId === player.id ||
        !defenderOwner.isAlive ||
        !canTarget(player, defenderOwner),
      () => null,
    )
    .otherwise((defenderOwner) =>
      chain(
        computeNeededTroops(
          target,
          defenderOwner,
          match(staging)
            .with(nullish, () => 0)
            .otherwise(
              (stagingPlanet) => getBuildingLevel(stagingPlanet, 'SILO') * 2,
            ),
        ),
      )
        .thru((neededTroops) =>
          match(
            staging !== null &&
              getRocketCapacity(staging) < neededTroops &&
              getBuildingLevel(staging, 'SILO') < 2,
          )
            .with(true, () => null)
            .otherwise(() =>
              buildInvasionPlan(
                player,
                target,
                defenderOwner,
                staging,
                neededTroops,
                tempo,
              ),
            ),
        )
        .value(),
    );
