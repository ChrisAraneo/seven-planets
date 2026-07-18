import { filter, firstValueFrom } from 'rxjs';

import { getGameOverObject, startGame } from '..';
import { getGameState } from '../get-game-state';
import { getGameStateLastValue } from '../get-game-state-last-value';
import { getTurn } from '../getters/get-turn';
import { resetGameState } from '../reset-game-state';
import { setGameState } from '../set-game-state';
import { chain } from '../utils/chain';
import { assignKamikazes } from './assign-kamikazes';
import { createSimulationResult } from './create-simulation-result';

const DEFAULT_KAMIKAZE_COUNT = 0;

export interface SimulationResult {
  turns: number;
  winner: { id: number; name: string; isHuman: boolean } | null;
  reason: string;
}

export const simulateGame = (
  options: { kamikazeCount?: number } = {},
): Promise<SimulationResult> =>
  chain(resetGameState())
    .tap(() =>
      setGameState({
        ...assignKamikazes(
          getGameStateLastValue(),
          options.kamikazeCount ?? DEFAULT_KAMIKAZE_COUNT,
        ),
      }),
    )
    .thru(() =>
      firstValueFrom(
        getGameState().pipe(filter((state) => state.cursor.phase === 'd1')),
      ),
    )
    .tap(() => startGame())
    .thru((done) =>
      done.then(() => createSimulationResult(getGameOverObject(), getTurn())),
    )
    .value();
