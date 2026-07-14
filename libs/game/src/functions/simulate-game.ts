import { filter, firstValueFrom } from 'rxjs';
import { match, P } from 'ts-pattern';

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
import { getGameOverObject } from '..';

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
  /* Each simulated game runs on a fresh state; games run strictly
     sequentially, so resetting between games is safe. Headless, every
     seat is AI-driven: the AI's getGameState() subscriptions answer each park
     synchronously (RxJS subjects deliver synchronously; the intent
     pipeline's queueScheduler flattens the loop), so the cursor rests at
     'done' by the time dispatch('start') returns. */
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
  return gameResult(getGameOverObject(), getTurn());
}

function gameResult(
  over: GameOver | undefined,
  turns: number,
): SimulationResult {
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
      .with(nonNullable, (gameOver) => gameOver.reason || 'timeout')
      .otherwise(() => 'timeout'),
  };
}
