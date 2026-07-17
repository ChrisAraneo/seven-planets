// @vitest-environment node
import '@/stores';

import { simulateGame } from '@seven-planets/game';
import { describe, expect, it } from 'vitest';

describe('headless game simulation', () => {
  it('plays full AI-vs-AI games to a resolution without throwing', async () => {
    for (let game = 0; game < 20; game++) {
      const result = await simulateGame();
      expect(result.turns).toBeGreaterThan(0);
      expect(['conquest', 'timeout']).toContain(result.reason);
      if (result.reason === 'conquest') {
        expect(result.winner).not.toBeNull();
      }
    }
  }, 60_000);
});
