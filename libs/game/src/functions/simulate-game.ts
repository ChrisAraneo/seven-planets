import { filter, firstValueFrom } from 'rxjs';
import { match, P } from 'ts-pattern';

import { getGameOverObject } from '..';
import { getTurn } from '../getters/get-turn';
import type { GameOver } from '../interfaces/game-over';
import {
  dispatch,
  getGameState,
  getGameStateLastValue,
  resetGameState,
  setGameState,
} from '../state';
import { assignKamikazes } from './assign-kamikazes';

const { nonNullable } = P;

interface SimulationResult {
  turns: number;
  winner: { id: number; name: string; isHuman: boolean } | null;
  reason: string;
}

export async function simulateGame(
  maxTurns = 400,
  options: { kamikazeCount?: number } = {},
): Promise<SimulationResult> {
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
}

function getGameResult(over: GameOver | null, turns: number): SimulationResult {
  return {
    turns,
    winner: match(over?.winner)
      .with(nonNullable, (player) => ({
        id: player.id,
        name: player.name,
        isHuman: player.isHuman,
      }))
      .otherwise(() => null),
    reason: match(over)
      .with(nonNullable, (gameOver) => gameOver.reason)
      .otherwise(() => 'timeout'),
  };
}
