import { match } from 'ts-pattern';

import type { GameState } from '../../../interfaces/game-state';
import type { InfluenceOptions } from '../../../interfaces/influence-options';
import type { InfluenceType } from '../../../interfaces/influence-type';
import { playCoup } from './play-coup';
import { playPeace } from './play-peace';
import { playSkip } from './play-skip';
import { playStealAction } from './play-steal-action';

export const playInfluence = (
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
  options: InfluenceOptions,
): boolean =>
  match(state.players[playerId].hand[influenceType] || 0)
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
