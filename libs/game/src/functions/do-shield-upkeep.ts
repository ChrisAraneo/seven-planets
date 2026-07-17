import type { GameState } from '../interfaces/game-state';
import { settleShield } from './settle-shield';

export const doShieldUpkeep = (state: GameState): GameState =>
  state.planets.reduce((acc, planet) => settleShield(acc, planet.id), state);
