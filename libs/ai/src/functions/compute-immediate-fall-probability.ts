import type { Planet, Player } from '@seven-planets/game';
import { COMBAT } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { chain } from '../utils/chain';
import { canTarget } from './can-target';
import { computeAggression } from './compute-aggression';
import { computeBattleWinProbability } from './compute-battle-win-probability';
import { computeDefenseBase } from './compute-defense-base';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { computeProjectedStrike } from './compute-projected-strike';
import { isUnderTruce } from './is-under-truce';

export const computeImmediateFallProbability = (
  owner: Player,
  planet: Planet,
): number =>
  match(planet)
    .when(isUnderTruce, () => 0)
    .otherwise(
      () =>
        1 -
        getAlivePlayers().reduce(
          (safeProbability, attacker) =>
            safeProbability *
            match(attacker)
              .when(
                (candidate) =>
                  candidate.id !== owner.id &&
                  !candidate.hasPacifistStatus &&
                  (candidate.hand.ATTACK || 0) >= 1 &&
                  canTarget(candidate, owner),
                (candidate) =>
                  chain(computeProjectedStrike(candidate, 0, planet.id))
                    .thru((strike) =>
                      match(
                        strike.n >=
                          computeMinimumTroopsToConquer(planet.troops),
                      )
                        .with(
                          true,
                          () =>
                            1 -
                            computeBattleWinProbability(
                              COMBAT.attackPerTroop * strike.n + strike.bonus,
                              computeDefenseBase(planet),
                            ) *
                              computeAggression(candidate),
                        )
                        .otherwise(() => 1),
                    )
                    .value(),
              )
              .otherwise(() => 1),
          1,
        ),
    );
