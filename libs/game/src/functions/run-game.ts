import { dispatch } from '../state';

/** Start the game: the 'start' intent logs the welcome lines and advances
    into turn 1 (see apply-start.ts / advance.ts). Fire and forget — the
    browser's subscriptions on state$ take it from there. */
export function runGame(): void {
  dispatch({ kind: 'start' });
}
