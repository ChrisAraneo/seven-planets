import { assign, chain, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import type { AttackPlanetPayload } from '../../../actions/attack-planet';
import { isUnderTruce } from '../../../functions/is-under-truce';
import { spendActionCard } from '../../../functions/spend-action-card';
import type { GameState } from '../../../interfaces/game-state';
import { announceLaunch } from './announce-launch';
import { breakPacifistVow } from './break-pacifist-vow';
import { maybeTaunt } from './maybe-taunt';
import { resolveBattle } from './resolve-battle';

export const doAttack = (
  state: GameState,
  { playerId: attackerId, sourceId, targetId, troops }: AttackPlanetPayload,
): void =>
  void match({
    source: state.planets[sourceId],
    target: state.planets[targetId],
  })
    .when(({ target }) => isUnderTruce(target), noop)
    .when(({ source }) => !source.buildings.SILO, noop)
    .otherwise(({ source }) =>
      chain(state)
        .tap(() => breakPacifistVow(state, attackerId))
        .thru(() => assign(state, spendActionCard(state, attackerId, 'ATTACK')))
        .tap(() =>
          assign(state.players[attackerId], {
            lastAttackTurn: state.turn,
          }),
        )
        .tap(() => assign(source, { troops: source.troops - troops }))
        .tap(() =>
          announceLaunch(state, attackerId, sourceId, targetId, troops),
        )
        .tap(() => maybeTaunt(state, attackerId))
        .tap(() => resolveBattle(state, attackerId, sourceId, targetId, troops))
        .value(),
    );
