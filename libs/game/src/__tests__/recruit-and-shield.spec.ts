/* Pins the ore-limited partial recruit and the shield rework:
   +4/+8/+16 by level, with the L3 shield drinking 2💎 upkeep per turn
   (unpaid → unpowered → only +8 that turn). */
import { describe, expect, it } from 'vitest';

import { doShieldUpkeep } from '../functions/do-shield-upkeep';
import { computeRecruitableTroops } from '../functions/compute-recruitable-troops';
import { computeShieldDefense } from '../functions/compute-shield-defense';
import { applyRecruitTroops } from '../reducers/recruit-troops/recruit-troops';
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
  shieldUnpowered = false,
): Planet {
  return {
    id,
    name: `P${id}`,
    ownerId: 0,
    troops,
    buildings,
    shieldUnpowered,
    protectedUntil: 0,
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

describe('partial recruit (ore-limited)', () => {
  it('recruits only as many troops as the hand can pay', () => {
    // Barracks L3 yields 4, but only 3⛏️ in hand → 3 troops for 3⛏️.
    const s = state([planet(0, 2, { BARRACKS: 3 })], { RECRUIT: 1, ORE: 3 });
    const after = applyRecruitTroops(s, { playerId: 0, planetId: 0 });
    expect(after.planets[0].troops).toBe(5);
    expect(after.players[0].hand.ORE).toBe(0);
    expect(after.players[0].hand.RECRUIT).toBe(0);
  });

  it('recruits the full yield when the hand affords it', () => {
    const s = state([planet(0, 0, { BARRACKS: 3 })], { RECRUIT: 1, ORE: 9 });
    const after = applyRecruitTroops(s, { playerId: 0, planetId: 0 });
    expect(after.planets[0].troops).toBe(4);
    expect(after.players[0].hand.ORE).toBe(5);
  });

  it('no-ops when not a single troop is payable', () => {
    const s = state([planet(0, 1, { BARRACKS: 2 })], { RECRUIT: 1 });
    const after = applyRecruitTroops(s, { playerId: 0, planetId: 0 });
    // The reducer clones before the planet-level guards; content is unchanged.
    expect(after).toStrictEqual(s);
  });

  it('relic wildcards stand in for missing ore', () => {
    const s = state([planet(0, 0, { BARRACKS: 2 })], {
      RECRUIT: 1,
      ORE: 1,
      RELIC: 1,
    });
    expect(computeRecruitableTroops(s.planets[0], s.players[0].hand)).toBe(2);
    const after = applyRecruitTroops(s, { playerId: 0, planetId: 0 });
    expect(after.planets[0].troops).toBe(2);
    expect(after.players[0].hand.RELIC).toBe(0);
  });
});

describe('shield defense: +4/+8/+16, unpowered L3 falls back to +8', () => {
  it.each([
    [0, 0],
    [1, 4],
    [2, 8],
    [3, 16],
  ])('level %i projects +%i', (level, defense) => {
    expect(
      computeShieldDefense(planet(0, 0, level ? { SHIELD: level } : {})),
    ).toBe(defense);
  });

  it('an unpowered L3 shield projects only +8', () => {
    expect(computeShieldDefense(planet(0, 0, { SHIELD: 3 }, true))).toBe(8);
  });
});

describe('L3 shield upkeep: 2💎 per turn or the shield runs unpowered', () => {
  it('drains 2 crystals and keeps the shield powered', () => {
    const s = state([planet(0, 0, { SHIELD: 3 })], { CRYSTAL: 5 });
    const after = doShieldUpkeep(s);
    expect(after.players[0].hand.CRYSTAL).toBe(3);
    expect(after.planets[0].shieldUnpowered).toBe(false);
  });

  it('marks the shield unpowered when crystals are short', () => {
    const s = state([planet(0, 0, { SHIELD: 3 })], { CRYSTAL: 1 });
    const after = doShieldUpkeep(s);
    expect(after.players[0].hand.CRYSTAL).toBe(1); // nothing drained
    expect(after.planets[0].shieldUnpowered).toBe(true);
    expect(after.log.some((entry) => entry.message.includes('UNPOWERED'))).toBe(
      true,
    );
  });

  it('re-powers a previously unpowered shield once upkeep is payable', () => {
    const s = state([planet(0, 0, { SHIELD: 3 }, true)], { CRYSTAL: 2 });
    const after = doShieldUpkeep(s);
    expect(after.players[0].hand.CRYSTAL).toBe(0);
    expect(after.planets[0].shieldUnpowered).toBe(false);
  });

  it('shields below L3 need no upkeep', () => {
    const s = state([planet(0, 0, { SHIELD: 2 })], { CRYSTAL: 5 });
    const after = doShieldUpkeep(s);
    expect(after.players[0].hand.CRYSTAL).toBe(5);
    expect(after.planets[0].shieldUnpowered).toBe(false);
  });
});
