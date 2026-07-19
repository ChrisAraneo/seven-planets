import { chain } from 'lodash-es';

import { COMBAT, HOME_FIELD } from '../../../config/constants';
import { computePacifistDefenseBonus } from '../../../functions/compute-pacifist-defense-bonus';
import { computeShieldDefense } from '../../../functions/compute-shield-defense';
import { computeSiloBonus } from '../../../functions/compute-silo-bonus';
import { computeSingularityDefenseBonus } from '../../../functions/compute-singularity-defense-bonus';
import { randomInt } from '../../../functions/random-int';
import type { GameState } from '../../../interfaces/game-state';
import type { BattleContext } from './resolve-battle';

export const computeBattlePowers = (
  state: GameState,
  sourceId: number,
  targetId: number,
  troops: number,
): Omit<BattleContext, 'didWin' | 'attLoss' | 'defLoss'> =>
  chain({
    source: state.planets[sourceId],
    target: state.planets[targetId],
    defenderId: state.planets[targetId].ownerId,
  })
    .thru(({ source, target, defenderId }) => ({
      source,
      target,
      defenderId,
      attackPower:
        COMBAT.attackPerTroop * troops +
        computeSiloBonus(source) +
        randomInt(0, COMBAT.attackRoll),
      defensePower:
        COMBAT.defensePerTroop * target.troops +
        computeShieldDefense(target) +
        computePacifistDefenseBonus(state, target) +
        computeSingularityDefenseBonus(target) +
        HOME_FIELD +
        randomInt(0, COMBAT.defenseRoll),
    }))
    .value();
