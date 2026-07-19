import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import { isSingularityInPlay } from './is-singularity-in-play';
import { log } from './log';

export const announceSingularity = (state: GameState): void =>
  match(!state.isSingularityAnnounced && isSingularityInPlay(state))
    .with(
      true,
      () =>
        void assign(
          state,
          log(
            assign(state, { isSingularityAnnounced: true }),
            '🌀 A Research Lab stands complete somewhere — the SINGULARITY card (technology + extra draft picks) can now appear in the pool!',
            'sys',
          ),
        ),
    )
    .otherwise(noop);
