import { assign } from 'lodash-es';
import { match, P } from 'ts-pattern';
import { getOver } from '../getters/get-over';
import { getTurn } from '../getters/get-turn';
import { getGameState, resetGameState } from '../game-state';
import type { GameOver } from '../interfaces/game-over';

import { assignKamikazes } from './assign-kamikazes';
import { playTurns } from './play-turns';

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
  // reactive: the AI is a store plugin that watches the game flags, so it
  // only reacts (drives AI seats) when those mutations are observable.
  return Promise.resolve(resetGameState())
    .then(() =>
      assign(
        getGameState(),
        assignKamikazes(getGameState(), opts.kamikazeCount ?? 0),
      ),
    )
    .then(() => playTurns(maxTurns))
    .then(() => gameResult(getOver(), getTurn()));
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
