import { filter, firstValueFrom } from 'rxjs';

import { getGameOverObject } from '..';
import { dispatch } from '../dispatch';
import { getGameState } from '../get-game-state';
import { getGameStateLastValue } from '../get-game-state-last-value';
import { getTurn } from '../getters/get-turn';
import { resetGameState } from '../reset-game-state';
import { setGameState } from '../set-game-state';
import { chain } from '../utils/chain';
import { assignKamikazes } from './assign-kamikazes';
import { getGameResult } from './get-game-result';

const DEFAULT_MAX_TURNS = 400;
const DEFAULT_KAMIKAZE_COUNT = 0;

export interface SimulationResult {
  turns: number;
  winner: { id: number; name: string; isHuman: boolean } | null;
  reason: string;
}

export const simulateGame = (
  maxTurns = DEFAULT_MAX_TURNS,
  options: { kamikazeCount?: number } = {},
): Promise<SimulationResult> =>
  chain(resetGameState())
    .tap(() =>
      setGameState({
        ...assignKamikazes(
          getGameStateLastValue(),
          options.kamikazeCount ?? DEFAULT_KAMIKAZE_COUNT,
        ),
        maxTurns,
      }),
    )
    .thru(() =>
      firstValueFrom(
        getGameState().pipe(filter((state) => state.cursor.phase === 'd1')),
      ),
    )
    .tap(() => dispatch({ kind: 'START' }))
    .thru((done) =>
      done.then(() => getGameResult(getGameOverObject(), getTurn())),
    )
    .value();
