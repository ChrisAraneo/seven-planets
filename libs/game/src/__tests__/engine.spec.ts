import { describe, expect, it } from 'vitest';

import { computeBuildingCost, canAfford } from '../config/constants';
import { createInitialGameState } from '../functions/create-initial-game-state';

describe('Seven Planets engine', () => {
  it('builds a fresh 7-seat galaxy', () => {
    const state = createInitialGameState();
    expect(state.players).toHaveLength(7);
    expect(state.planets).toHaveLength(7);
    expect(state.players[0].isHuman).toBe(true);
    // Everyone starts with 3 troops and no resources.
    expect(state.planets.every((planet) => planet.troops === 3)).toBe(true);
    expect(state.players[0].hand.ORE).toBe(0);
  });

  it('scales building cost by level (N× base)', () => {
    expect(computeBuildingCost('MINE', 1)).toEqual({ CRYSTAL: 1, ENERGY: 1 });
    expect(computeBuildingCost('MINE', 2)).toEqual({ CRYSTAL: 2, ENERGY: 2 });
  });

  it('treats relics as wildcards when paying costs', () => {
    expect(canAfford({ RELIC: 2 }, { ORE: 1, ENERGY: 1 })).toBe(true);
    expect(canAfford({ ORE: 1, RELIC: 0 }, { ORE: 1, ENERGY: 1 })).toBe(false);
  });
});
