import { assign } from 'lodash-es';
import { match, P } from 'ts-pattern';
import { getOver } from '../getters/get-over';
import { getTurn } from '../getters/get-turn';
import { getGameState, resetGameState } from '../game-state';
import type { GameOver } from '../interfaces/game-over';

import { assignKamikazes } from './assign-kamikazes';
import { playTurns } from './play-turns';
import { startEngine } from './engine-driver';

const { nonNullable } = P;

interface SimulationResult {
  turns: number;
  winner: { id: number; name: string; isHuman: boolean } | null;
  reason: string;
}

export async function simulateGame(
  maxTurns = 400,
  opts: { kamikazeCount?: number } = {},
): Promise<SimulationResult> {
  // Each simulated game runs on a fresh state in the store's game module;
  // every engine/AI function reads it from there. Games run strictly
  // sequentially, so resetting between games is safe. The state must stay
  // reactive: the AI drives every seat through its `watch` on inputSeq,
  // so it only reacts when the engine's mutations are observable.
  resetGameState();
  assign(
    getGameState(),
    assignKamikazes(getGameState(), opts.kamikazeCount ?? 0),
  );
  // The engine parks at each seat's input; the AI's watcher answers on
  // the following flush, so the game completes over a chain of microtasks.
  await startEngine(() => playTurns(maxTurns));
  return gameResult(getOver(), getTurn());
}

function gameResult(over: GameOver | null, turns: number): SimulationResult {
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
