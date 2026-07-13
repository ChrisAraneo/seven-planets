import {
  BehaviorSubject,
  catchError,
  defer,
  filter,
  mergeMap,
  type Observable,
  observeOn,
  of,
  queueScheduler,
  Subject,
} from 'rxjs';
import { chain } from 'lodash-es';

import { initializeState } from './functions/initialize-state';
import type { Action } from './actions/action';
import type { GameState } from './interfaces/game-state';
import { reduce } from './reducers/reduce';

/* =====================================================================
   The game core as one fold:

     intent$ ─observeOn(queueScheduler)─▶ mergeMap(reduceIntentSafely)
             ─▶ filter(non-null) ─▶ getGameState()

   Every player intent (human click, AI decision, sim driver) enters
   through dispatch(); the reducer applies it and advances the game to
   its next parked input; the resulting snapshot is the emission — there
   is no publish call anywhere, emitting is what the pipeline does.

   queueScheduler serializes re-entrant intents: the headless AI answers
   parks synchronously from a getGameState() subscription, and the scheduler
   flattens that recursion into iteration (no stack growth). It is the
   only scheduler in the system.

   The reducer must never throw — a throw would error getGameState() for every
   subscriber — so reduceIntentSafely turns a faulty intent into a
   no-op (null, filtered out) instead of letting it error the stream.
   ===================================================================== */

const actionSubject = new Subject<Action>();
const stateSubject = new BehaviorSubject<GameState>(initializeState());

actionSubject
  .pipe(
    observeOn(queueScheduler),
    mergeMap((action) =>
      defer(() => of(reduce(stateSubject.getValue(), action))).pipe(
        catchError((error: unknown) =>
          chain(error)
            .tap((error) =>
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

export function dispatch(action: Action): void {
  actionSubject.next(action);
}

export function getGameState(): Observable<GameState> {
  return stateSubject.asObservable();
}

export function getGameStateLastValue(): GameState {
  return stateSubject.getValue();
}

export function setGameState(state: GameState): void {
  stateSubject.next(state);
}

export function resetGameState(): void {
  stateSubject.next(initializeState());
}
