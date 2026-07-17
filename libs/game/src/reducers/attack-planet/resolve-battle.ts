import { assign } from 'lodash-es';

import { checkWin } from '../../functions/check-win';
import { emitEffect } from '../../functions/emit-effect';
import { log } from '../../functions/log';
import type { GameState } from '../../interfaces/game-state';
import type { Planet } from '../../interfaces/planet';
import { chain } from '../../utils/chain';
import { applyOutcome } from './apply-outcome';
import { computeBattleLosses } from './compute-battle-losses';
import { computeBattlePowers } from './compute-battle-powers';
import { getBattleLine } from './get-battle-line';

export interface BattleContext {
  source: Planet;
  target: Planet;
  defenderId: number;
  attackPower: number;
  defensePower: number;
  didWin: boolean;
  attLoss: number;
  defLoss: number;
}

export const resolveBattle = (
  state: GameState,
  attackerId: number,
  sourceId: number,
  targetId: number,
  troops: number,
): void =>
  void chain(computeBattlePowers(state, sourceId, targetId, troops))
    .thru((context) => ({
      ...context,
      didWin: context.attackPower > context.defensePower,
    }))
    .thru(
      (context): BattleContext => ({
        ...context,
        ...computeBattleLosses(context.didWin, troops, context.target.troops),
      }),
    )
    .tap(({ target, defLoss }) =>
      assign(target, { troops: target.troops - defLoss }),
    )
    .tap(() =>
      assign(state, emitEffect(state, { kind: 'boom', planetId: targetId })),
    )
    .tap((battle) =>
      assign(
        state,
        log(state, getBattleLine(state, battle, attackerId), 'war'),
      ),
    )
    .tap((battle) => applyOutcome(state, battle, attackerId, targetId, troops))
    .thru(() => assign(state, checkWin(state)))
    .value();
