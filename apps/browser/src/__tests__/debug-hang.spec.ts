// @vitest-environment node
import '@/stores';

import {
  getGameState,
  getGameStateLastValue,
  startGame,
} from '@seven-planets/game';
import { describe, it } from 'vitest';

describe('debug hang', () => {
  it('traces state emissions after startGame', async () => {
    const seen: string[] = [];
    const sub = getGameState().subscribe((s) => {
      seen.push(
        JSON.stringify({
          cursor: s.cursor,
          phase: s.phase,
          turn: s.turn,
          activeId: s.activeId,
          pick: s.isAwaitingPick,
          act: s.isAwaitingAction,
          inputSeq: s.inputSeq,
          over: s.over,
          status: s.status,
        }),
      );
    });
    startGame();
    await new Promise((r) => {
      setTimeout(r, 3000);
    });
    sub.unsubscribe();
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    fs.writeFileSync(
      path.join(os.tmpdir(), 'seven-planets-hang-trace.txt'),
      `EMISSIONS=${seen.length}\n${seen
        .slice(0, 20)
        .join('\n')}\n...\nLAST:\n${seen
        .slice(-5)
        .join('\n')}\nFINAL planets sample: ${JSON.stringify(
        getGameStateLastValue().planets.slice(0, 2),
      )}`,
    );
  }, 20_000);
});
