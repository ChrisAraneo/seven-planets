import {
  BehaviorSubject,
  map,
  type Observable,
  observeOn,
  queueScheduler,
  Subject,
} from 'rxjs';

import { initializeState } from './functions/initialize-state';
import type { GameIntent } from './intents';
import type { GameState } from './interfaces/game-state';
import { reduce } from './reduce';

/* =====================================================================
   The game core as one fold:

     intent$ ─observeOn(queueScheduler)─▶ map(reduce) ─▶ state$

   Every player intent (human click, AI decision, sim driver) enters
   through dispatch(); the reducer applies it and advances the game to
   its next parked input; the resulting snapshot is the emission — there
   is no publish call anywhere, emitting is what the pipeline does.

   queueScheduler serializes re-entrant intents: the headless AI answers
   parks synchronously from a state$ subscription, and the scheduler
   flattens that recursion into iteration (no stack growth). It is the
   only scheduler in the system.

   The reducer must never throw — a throw would error state$ for every
   subscriber — so a defensive catch reduces a faulty intent to a no-op.
   ===================================================================== */

const intent$ = new Subject<GameIntent>();
const subject = new BehaviorSubject<GameState>(initializeState());

intent$
  .pipe(
    observeOn(queueScheduler),
    /* Reading the accumulator from the subject instead of scan's closure
       keeps resetGameState trivially correct between simulated games. */
    map((intent) => {
      try {
        return reduce(subject.getValue(), intent);
      } catch (error) {
        console.error('[seven-planets] intent reduced to a no-op:', error);
        return subject.getValue();
      }
    }),
  )
  .subscribe((state) => subject.next(state));

export const state$: Observable<GameState> = subject.asObservable();

export function dispatch(intent: GameIntent): void {
  intent$.next(intent);
}

/** Hot-loop reads (canvas frames, AI planning) — the live snapshot. */
export function getGameState(): GameState {
  return subject.getValue();
}

/** Install a state directly — reserved for setup-time seeding (difficulty
    kamikazes, tests). Gameplay goes through dispatch(). */
export function setGameState(state: GameState): void {
  subject.next(state);
}

export function resetGameState(): void {
  subject.next(initializeState());
}
