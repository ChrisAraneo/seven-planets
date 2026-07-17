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

export const actionSubject = new Subject<Action>();
export const stateSubject = new BehaviorSubject<GameState>(
  createInitialGameState(),
);

actionSubject
  .pipe(
    observeOn(queueScheduler),
    mergeMap((action) =>
      defer(() => of(reduce(stateSubject.getValue(), action))).pipe(
        catchError((error: unknown) =>
          chain(error)
            .tap(() =>
              console.error(
                '[seven-planets] action reduced to a no-op:',
                error,
              ),
            )
            .thru(() => of(null))
            .value(),
        ),
      ),
    ),
    filter((state): state is GameState => state !== null),
  )
  .subscribe((state) => stateSubject.next(state));
