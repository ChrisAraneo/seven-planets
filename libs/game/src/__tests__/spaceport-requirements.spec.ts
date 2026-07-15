/* Spaceport is a prerequisite in two places:
   - a 🛸 Move launches only FROM a planet that has a Spaceport;
   - a 🤝 Embassy can only be built on a planet that already has one. */
import { describe, expect, it } from 'vitest';

import { canPickCard } from '../functions/can-pick-card';
import { applyMoveTroops } from '../reducers/move-troops/move-troops';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';

function player(hand: Record<string, number> = {}): Player {
  return {
    id: 0,
    name: 'You',
    color: '#fff',
    isHuman: true,
    isAlive: true,
    hand,
    influence: 0,
  } as unknown as Player;
}

function planet(
  id: number,
  troops: number,
  buildings: Record<string, number>,
): Planet {
  return {
    id,
    name: `P${id}`,
    ownerId: 0,
    troops,
    buildings,
  } as unknown as Planet;
}

function state(
  planets: Planet[],
  hand: Record<string, number> = {},
): GameState {
  return {
    turn: 12,
    phase: 'action',
    cursor: { phase: 'action', seatQueue: [0], seatIdx: 0 },
    maxTurns: 200,
    over: null,
    pool: [],
    activeId: 0,
    draftPlanetId: 0,
    singularityAnnounced: false,
    startIdx: 0,
    players: [player(hand)],
    planets,
    log: [],
    effects: [],
    effectSeq: 0,
    status: '',
    awaitingPick: false,
    awaitingAction: true,
    inputSeq: 0,
    pendingOffer: null,
  } as unknown as GameState;
}

describe('Move requires a Spaceport on the SOURCE planet', () => {
  const move = { playerId: 0, fromId: 0, toId: 1, troops: 3 };

  it('blocks a move launched from a planet with no Spaceport', () => {
    const s = state(
      [planet(0, 5, {}), planet(1, 0, { SPACEPORT: 1 })], // Spaceport on the DEST, not source
      { MOVE: 1 },
    );
    const after = applyMoveTroops(s, move);
    expect(after.planets[0].troops).toBe(5);
    expect(after.planets[1].troops).toBe(0);
    expect(after.players[0].hand.MOVE).toBe(1); // card not spent
  });

  it('allows a move launched from a Spaceport planet', () => {
    const s = state([planet(0, 5, { SPACEPORT: 1 }), planet(1, 0, {})], {
      MOVE: 1,
    });
    const after = applyMoveTroops(s, move);
    expect(after.planets[0].troops).toBe(2);
    expect(after.planets[1].troops).toBe(3);
    expect(after.players[0].hand.MOVE).toBe(0); // card spent
  });
});

describe('Embassy requires a Spaceport on the SAME planet', () => {
  const hand = { ORE: 5, CRYSTAL: 5, ENERGY: 5 }; // affords the Embassy

  it('cannot pick an Embassy on a planet without a Spaceport', () => {
    const p = planet(0, 0, {});
    const s = state([p], hand);
    expect(canPickCard(s, s.players[0], 'EMBASSY', p)).toBe(false);
  });

  it('can pick an Embassy on a planet that has a Spaceport', () => {
    const p = planet(0, 0, { SPACEPORT: 1 });
    const s = state([p], hand);
    expect(canPickCard(s, s.players[0], 'EMBASSY', p)).toBe(true);
  });
});
