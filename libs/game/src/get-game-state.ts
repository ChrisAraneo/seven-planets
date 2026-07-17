import { type Observable } from 'rxjs';

import type { GameState } from './interfaces/game-state';
import { stateSubject } from './state';

export const getGameState = (): Observable<GameState> =>
  stateSubject.asObservable();
