import {
  BehaviorSubject,
  catchError,
  defer,
  filter,
  mergeMap,
  observeOn,
  of,
  queueScheduler,
  Subject,
} from 'rxjs';

import type { Action } from './actions/action';
import { createInitialGameState } from './functions/create-initial-game-state';
import type { GameState } from './interfaces/game-state';
import { reduce } from './reducers/reduce';
import { chain } from './utils/chain';

export const ACTION_SUBJECT = new Subject<Action>();
export const STATE_SUBJECT = new BehaviorSubject<GameState>(
  createInitialGameState(),
);

ACTION_SUBJECT.pipe(
  observeOn(queueScheduler),
  mergeMap((action) =>
    defer(() => of(reduce(STATE_SUBJECT.getValue(), action))).pipe(
      catchError((error: unknown) =>
        chain(error)
          .tap(() =>
            // eslint-disable-next-line no-console
            console.error('[seven-planets] action reduced to a no-op:', error),
          )
          .thru(() => of(null))
          .value(),
      ),
    ),
  ),
  filter((state): state is GameState => state !== null),
).subscribe((state) => STATE_SUBJECT.next(state));
