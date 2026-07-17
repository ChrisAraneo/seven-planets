import { cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { AttackPlanetPayload } from '../../actions/attack-planet';
import { hasActionCard } from '../../functions/has-action-card';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { doAttack } from './do-attack';

export const applyAttackPlanet = (
  state: GameState,
  payload: AttackPlanetPayload,
): GameState =>
  match(state)
    .when(
      () => payload.playerId !== state.activeId || Boolean(state.over),
      () => state,
    )
    .when(
      () => !hasActionCard(state.players[payload.playerId], 'ATTACK'),
      () => state,
    )
    .otherwise(() =>
      chain(cloneDeep(state))
        .tap((clone) => doAttack(clone, payload))
        .value(),
    );
