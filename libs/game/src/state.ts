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
import { chain } from './utils/chain';
import { initializeState } from './functions/initialize-state';
import type { GameState } from './interfaces/game-state';
import { reduce } from './reducers/reduce';
import type { Action } from './actions/action';

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
