import type { Player } from '@seven-planets/game';
import { COMBAT } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { chain } from '../utils/chain';
import { canTarget } from './can-target';
import { computeBattleWinProbability } from './compute-battle-win-probability';
import { computeDefenseBase } from './compute-defense-base';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { computeProjectedStrike } from './compute-projected-strike';
import { getOwnedPlanets } from './get-owned-planets';
import { isUnderTruce } from './is-under-truce';

export const isImminentAttacker = (owner: Player, attacker: Player): boolean =>
  !attacker.hasPacifistStatus &&
  (attacker.hand.ATTACK || 0) >= 1 &&
  canTarget(attacker, owner) &&
  getOwnedPlanets(owner).some((planet) =>
    match(planet)
      .when(isUnderTruce, () => false)
      .otherwise(() =>
        chain(computeProjectedStrike(attacker, 0, planet.id))
          .thru(
            (strike) =>
              strike.n >= computeMinimumTroopsToConquer(planet.troops) &&
              computeBattleWinProbability(
                COMBAT.attackPerTroop * strike.n + strike.bonus,
                computeDefenseBase(planet),
              ) >= 0.35,
          )
          .value(),
      ),
  );
