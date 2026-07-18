import { type Observable } from 'rxjs';

import type { GameState } from './interfaces/game-state';
import { STATE_SUBJECT } from './state';

export const getGameState = (): Observable<GameState> =>
  STATE_SUBJECT.asObservable();
