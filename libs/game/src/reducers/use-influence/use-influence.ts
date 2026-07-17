import { cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { UseInfluencePayload } from '../../actions/use-influence';
import type { GameState } from '../../interfaces/game-state';
import type { InfluenceOptions } from '../../interfaces/influence-options';
import type { InfluenceType } from '../../interfaces/influence-type';
import { chain } from '../../utils/chain';
import { playCoup } from './play-coup';
import { playPeace } from './play-peace';
import { playSkip } from './play-skip';
import { playStealAction } from './play-steal-action';

/* Reducer branch. Resolves the play on a private clone; illegal intents
   (including refused plays inside playInfluence) reduce to a state with no
   gameplay change. */
export function applyUseInfluence(
  state: GameState,
  payload: UseInfluencePayload,
): GameState {
  return match(state)
    .when(
      () => payload.playerId !== state.activeId || Boolean(state.over),
      () => state,
    )
    .otherwise(() =>
      chain(cloneDeep(state))
        .tap((clone) =>
          playInfluence(
            clone,
            payload.playerId,
            payload.type,
            payload.options ?? {},
          ),
        )
        .value(),
    );
}

// Applies pure engine results onto the private clone via assign and reads
// Entities by id (options carry frozen selector clones — we use only their ids), so the
// Whole play resolves consistently on the state that gets written back.
function playInfluence(
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
  options: InfluenceOptions,
): boolean {
  return match(state.players[playerId].hand[influenceType] || 0)
    .when(
      (held) => held < 1,
      () => false,
    )
    .otherwise(() =>
      match(influenceType)
        .when(
          (type) => type.startsWith('SKIP_'),
          (type) => playSkip(state, playerId, type),
        )
        .with('STEAL_ACTION', (type) =>
          playStealAction(state, playerId, type, options),
        )
        .with('COUP', (type) => playCoup(state, playerId, type, options))
        .with('PEACE', (type) => playPeace(state, playerId, type))
        .otherwise(() => false),
    );
}
