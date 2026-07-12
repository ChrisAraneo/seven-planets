// @vitest-environment node
// In a Node environment there is no `document`, so the engine's AUTO_HUMAN is
// True and every seat is played by the AI — letting us run whole games headless.
// Importing the store creates it and installs the state accessor. The AI
// answers every engine suspension synchronously (no DOM → no pacing timers),
// so each simulateGame call runs a whole game to completion synchronously.
import '@/stores';

import { describe, expect, it } from 'vitest';

import { simulateGame } from '@seven-planets/game';

describe('headless game simulation', () => {
  it('plays full AI-vs-AI games to a resolution without throwing', () => {
    for (let game = 0; game < 20; game++) {
      const result = simulateGame();
      expect(result.turns).toBeGreaterThan(0);
      // Either someone conquered the galaxy, or the 400-turn cap was hit.
      expect(['conquest', 'timeout']).toContain(result.reason);
      if (result.reason === 'conquest') {
        expect(result.winner).not.toBeNull();
      }
    }
  }, 60_000);
});
