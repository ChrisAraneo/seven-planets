// @vitest-environment node
// In a Node environment there is no `document`, so the engine's IS_AUTO_HUMAN is
// True and every seat is played by the AI — letting us run whole games headless.
// Importing the store seats the AI's getGameState() subscriptions, which answer every
// Engine park synchronously (RxJS subjects deliver synchronously; the engine
// Stream's queueScheduler flattens the loop) — games run at pure logic speed.
import '@/stores';

import { simulateGame } from '@seven-planets/game';
import { describe, expect, it } from 'vitest';

describe('headless game simulation', () => {
  it('plays full AI-vs-AI games to a resolution without throwing', async () => {
    for (let game = 0; game < 20; game++) {
      const result = await simulateGame();
      expect(result.turns).toBeGreaterThan(0);
      // Either someone conquered the galaxy, or the 400-turn cap was hit.
      expect(['conquest', 'timeout']).toContain(result.reason);
      if (result.reason === 'conquest') {
        expect(result.winner).not.toBeNull();
      }
    }
  }, 60_000);
});
