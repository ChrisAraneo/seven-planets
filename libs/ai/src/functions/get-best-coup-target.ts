import type { Planet, Player } from '@seven-planets/game';
import { getPlanets } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';
import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { canTarget } from './can-target';
import { computePlanetValue } from './compute-planet-value';
import { getOwnedPlanets } from './get-owned-planets';
import { isUnderTruce } from './is-under-truce';

const isViableCoupTarget = (
  player: Player,
  owner: Player,
  planet: Planet,
  canTakeLastPlanet: boolean,
): boolean =>
  planet.ownerId !== player.id &&
  owner.isAlive &&
  !isUnderTruce(planet) &&
  canTarget(player, owner) &&
  (canTakeLastPlanet || getOwnedPlanets(owner).length > 1);

export const getBestCoupTarget = (
  player: Player,
): { planet: Planet; value: number } | null =>
  match(player.isKamikaze)
    .with(true, () => null)
    .otherwise(() =>
      getPlanets().reduce<{ planet: Planet; value: number } | null>(
        (best, candidatePlanet) =>
          match(getPlayerByIndex(candidatePlanet.ownerId))
            .with(nullish, () => best)
            .when(
              (owner) =>
                !isViableCoupTarget(
                  player,
                  owner,
                  candidatePlanet,
                  player.hasPacifistStatus,
                ),
              () => best,
            )
            .otherwise((owner) =>
              chain(
                computePlanetValue(candidatePlanet) +
                  match(getOwnedPlanets(owner).length)
                    .with(1, () => 10)
                    .otherwise(() => 0),
              )
                .thru((value) =>
                  match(!best || value > best.value)
                    .with(true, () => ({ planet: candidatePlanet, value }))
                    .otherwise(() => best),
                )
                .value(),
            ),
        null,
      ),
    );
