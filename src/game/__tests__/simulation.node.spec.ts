// @vitest-environment node
// In a Node environment there is no `document`, so the engine's AUTO_HUMAN is
// True and every seat is played by the AI — letting us run whole games headless.
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import { setSimMode } from '@/game/effects';
import { simulateGameWithPersonalities } from '@/game/engine/functions/simulate-game-with-personalities';

// All game state lives in Pinia stores now — install one before anything runs.
setActivePinia(createPinia());

describe('headless game simulation', () => {
  setSimMode(true); // No animation delays — pure logic speed

  it('plays full AI-vs-AI games to a resolution without throwing', async () => {
    for (let g = 0; g < 20; g++) {
      const result = await simulateGameWithPersonalities([]);
      expect(result.turns).toBeGreaterThan(0);
      // Either someone conquered the galaxy, or the 400-turn cap was hit.
      expect(['conquest', 'timeout']).toContain(result.reason);
      if (result.reason === 'conquest') {
        expect(result.winner).not.toBeNull();
      }
    }
  }, 30_000);
});
