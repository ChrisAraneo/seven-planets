import { filter, firstValueFrom } from 'rxjs';

import { getGameOverObject } from '..';
import { dispatch } from '../dispatch';
import { getGameState } from '../get-game-state';
import { getGameStateLastValue } from '../get-game-state-last-value';
import { getTurn } from '../getters/get-turn';
import { resetGameState } from '../reset-game-state';
import { setGameState } from '../set-game-state';
import { assignKamikazes } from './assign-kamikazes';
import { getGameResult } from './get-game-result';

export interface SimulationResult {
  turns: number;
  winner: { id: number; name: string; isHuman: boolean } | null;
  reason: string;
}

export const simulateGame = async (
  maxTurns = 400,
  options: { kamikazeCount?: number } = {},
): Promise<SimulationResult> => {
  resetGameState();
  setGameState({
    ...assignKamikazes(getGameStateLastValue(), options.kamikazeCount ?? 0),
    maxTurns,
  });
  const done = firstValueFrom(
    getGameState().pipe(filter((state) => state.cursor.phase === 'done')),
  );
  dispatch({ kind: 'START' });
  await done;
  return getGameResult(getGameOverObject(), getTurn());
};
