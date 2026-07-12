import { assign } from 'lodash-es';
import { match, P } from 'ts-pattern';
import { getOver } from '../getters/get-over';
import { getTurn } from '../getters/get-turn';
import { getGameState, resetGameState } from '../game-state';
import type { GameOver } from '../interfaces/game-over';

import { assignKamikazes } from './assign-kamikazes';
import { playTurns } from './play-turns';
import { isEngineActive, startEngine } from './engine-driver';

const { nonNullable } = P;

interface SimulationResult {
  turns: number;
  winner: { id: number; name: string; isHuman: boolean } | null;
  reason: string;
}

// Fully SYNCHRONOUS: in a headless run every seat is AI-driven and the AI
// answers each engine suspension synchronously (see the ai lib's input
// listener), so the whole game completes inside startEngine.
export function simulateGame(
  maxTurns = 400,
  opts: { kamikazeCount?: number } = {},
): SimulationResult {
  // Each simulated game runs on a fresh state in the store's game module;
  // every engine/AI function reads it from there. Games run strictly
  // sequentially, so resetting between games is safe. Raw (non-reactive)
  // state: the AI is driven by the engine's input listener, not by Vue
  // watchers, so nothing headless needs reactivity — and the AI's hot
  // loops read the state millions of times per game.
  resetGameState({ raw: true });
  assign(
    getGameState(),
    assignKamikazes(getGameState(), opts.kamikazeCount ?? 0),
  );
  startEngine(() => playTurns(maxTurns));
  if (isEngineActive()) {
    throw new Error(
      'simulateGame: the engine is still parked awaiting input — a seat was not answered synchronously (is the AI driver installed?)',
    );
  }
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
