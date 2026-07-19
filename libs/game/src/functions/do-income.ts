import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import { addPlanetIncome } from './add-planet-income';
import { applyIncome } from './apply-income';
import { logIncome } from './log-income';

export interface IncomeTally {
  handAdd: Partial<Record<number, Record<string, number>>>;
  infAdd: Partial<Record<number, number>>;
  gains: Partial<Record<number, Record<string, number>>>;
  moveGains: Partial<Record<number, number>>;
  infGains: Partial<Record<number, number>>;
  pacGains: Partial<Record<number, number>>;
}

export const doIncome = (state: GameState): GameState =>
  chain(
    state.planets.reduce<IncomeTally>(
      (tally, planet) => addPlanetIncome(tally, state, planet),
      {
        handAdd: {},
        infAdd: {},
        gains: {},
        moveGains: {},
        infGains: {},
        pacGains: {},
      },
    ),
  )
    .thru((tally) => logIncome(applyIncome(state, tally), tally))
    .value();
