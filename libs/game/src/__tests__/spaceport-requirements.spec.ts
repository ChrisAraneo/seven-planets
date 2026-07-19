import { noop } from 'lodash-es';
import { describe, expect, it } from 'vitest';

import { canPickCard } from '../functions/can-pick-card';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { applyMoveTroops } from '../reducers/move-troops/apply-move-troops';
import { chain } from '../utils/chain';

const player = (hand: Record<string, number> = {}): Player =>
  ({
    id: 0,
    name: 'You',
    color: '#fff',
    isHuman: true,
    isAlive: true,
    hand,
    influence: 0,
  }) as unknown as Player;

const planet = (
  id: number,
  troops: number,
  buildings: Record<string, number>,
): Planet =>
  ({
    id,
    name: `P${id}`,
    ownerId: 0,
    troops,
    buildings,
  }) as unknown as Planet;

const state = (
  planets: Planet[],
  hand: Record<string, number> = {},
): GameState =>
  ({
    turn: 12,
    phase: 'ACTION',
    cursor: { phase: 'ACTION', seatQueue: [0], seatIdx: 0 },
    over: null,
    pool: [],
    activeId: 0,
    draftPlanetId: 0,
    isSingularityAnnounced: false,
    startIndex: 0,
    players: [player(hand)],
    planets,
    log: [],
    effects: [],
    effectSeq: 0,
    status: '',
    isAwaitingPick: false,
    isAwaitingAction: true,
    inputSeq: 0,
    pendingOffer: null,
  }) as unknown as GameState;

describe('Move requires a Spaceport on the SOURCE planet', () => {
  const move = { playerId: 0, fromId: 0, toId: 1, troops: 3 };

  it('blocks a move launched from a planet with no Spaceport', () =>
    chain(
      state([planet(0, 5, {}), planet(1, 0, { SPACEPORT: 1 })], { MOVE: 1 }),
    )
      .thru((s) => applyMoveTroops(s, move))
      .tap((after) => expect(after.planets[0].troops).toBe(5))
      .tap((after) => expect(after.planets[1].troops).toBe(0))
      .tap((after) => expect(after.players[0].hand.MOVE).toBe(1))
      .thru(noop)
      .value());

  it('allows a move launched from a Spaceport planet', () =>
    chain(
      state([planet(0, 5, { SPACEPORT: 1 }), planet(1, 0, {})], { MOVE: 1 }),
    )
      .thru((s) => applyMoveTroops(s, move))
      .tap((after) => expect(after.planets[0].troops).toBe(2))
      .tap((after) => expect(after.planets[1].troops).toBe(3))
      .tap((after) => expect(after.players[0].hand.MOVE).toBe(0))
      .thru(noop)
      .value());
});

describe('Embassy requires a Spaceport on the SAME planet', () => {
  const hand = { ORE: 5, CRYSTAL: 5, ENERGY: 5 };

  it('cannot pick an Embassy on a planet without a Spaceport', () =>
    chain(planet(0, 0, {}))
      .thru((p) => ({ p, s: state([p], hand) }))
      .tap(({ p, s }) =>
        expect(canPickCard(s, s.players[0], 'EMBASSY', p)).toBe(false),
      )
      .thru(noop)
      .value());

  it('can pick an Embassy on a planet that has a Spaceport', () =>
    chain(planet(0, 0, { SPACEPORT: 1 }))
      .thru((p) => ({ p, s: state([p], hand) }))
      .tap(({ p, s }) =>
        expect(canPickCard(s, s.players[0], 'EMBASSY', p)).toBe(true),
      )
      .thru(noop)
      .value());
});
