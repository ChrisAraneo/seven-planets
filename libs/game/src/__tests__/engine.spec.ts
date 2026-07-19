import { noop } from 'lodash-es';
import { describe, expect, it } from 'vitest';

import { canAfford } from '../functions/can-afford';
import { computeBuildingCost } from '../functions/compute-building-cost';
import { createInitialGameState } from '../functions/create-initial-game-state';
import { chain } from '../utils/chain';

describe('Seven Planets engine', () => {
  it('builds a fresh 7-seat galaxy', () =>
    chain(createInitialGameState())
      .tap((state) => expect(state.players).toHaveLength(7))
      .tap((state) => expect(state.planets).toHaveLength(7))
      .tap((state) => expect(state.players[0].isHuman).toBe(true))
      .tap((state) =>
        expect(state.planets.every((planet) => planet.troops === 3)).toBe(true),
      )
      .tap((state) => expect(state.players[0].hand.ORE).toBe(0))
      .thru(noop)
      .value());

  it('scales building cost by level (N× base)', () =>
    chain(
      expect(computeBuildingCost('MINE', 1)).toEqual({ CRYSTAL: 1, ENERGY: 1 }),
    )
      .tap(() =>
        expect(computeBuildingCost('MINE', 2)).toEqual({
          CRYSTAL: 2,
          ENERGY: 2,
        }),
      )
      .thru(noop)
      .value());

  it('treats relics as wildcards when paying costs', () =>
    chain(expect(canAfford({ RELIC: 2 }, { ORE: 1, ENERGY: 1 })).toBe(true))
      .tap(() =>
        expect(canAfford({ ORE: 1, RELIC: 0 }, { ORE: 1, ENERGY: 1 })).toBe(
          false,
        ),
      )
      .thru(noop)
      .value());
});
