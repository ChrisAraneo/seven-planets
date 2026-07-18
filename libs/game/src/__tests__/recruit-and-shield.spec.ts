import { noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { describe, expect, it } from 'vitest';

import { computeRecruitableTroops } from '../functions/compute-recruitable-troops';
import { computeShieldDefense } from '../functions/compute-shield-defense';
import { doShieldUpkeep } from '../functions/do-shield-upkeep';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { applyRecruitTroops } from '../reducers/recruit-troops/apply-recruit-troops';
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
  isShieldUnpowered = false,
): Planet =>
  ({
    id,
    name: `P${id}`,
    ownerId: 0,
    troops,
    buildings,
    isShieldUnpowered,
    protectedUntil: 0,
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

describe('partial recruit (ore-limited)', () => {
  it('recruits only as many troops as the hand can pay', () =>
    chain(state([planet(0, 2, { BARRACKS: 3 })], { RECRUIT: 1, ORE: 3 }))
      .thru((s) => applyRecruitTroops(s, { playerId: 0, planetId: 0 }))
      .tap((after) => expect(after.planets[0].troops).toBe(5))
      .tap((after) => expect(after.players[0].hand.ORE).toBe(0))
      .tap((after) => expect(after.players[0].hand.RECRUIT).toBe(0))
      .thru(noop)
      .value());

  it('recruits the full yield when the hand affords it', () =>
    chain(state([planet(0, 0, { BARRACKS: 3 })], { RECRUIT: 1, ORE: 9 }))
      .thru((s) => applyRecruitTroops(s, { playerId: 0, planetId: 0 }))
      .tap((after) => expect(after.planets[0].troops).toBe(4))
      .tap((after) => expect(after.players[0].hand.ORE).toBe(5))
      .thru(noop)
      .value());

  it('no-ops when not a single troop is payable', () =>
    chain(state([planet(0, 1, { BARRACKS: 2 })], { RECRUIT: 1 }))
      .thru((s) => ({
        s,
        after: applyRecruitTroops(s, { playerId: 0, planetId: 0 }),
      }))
      .tap(({ s, after }) => expect(after).toStrictEqual(s))
      .thru(noop)
      .value());

  it('relic wildcards stand in for missing ore', () =>
    chain(
      state([planet(0, 0, { BARRACKS: 2 })], { RECRUIT: 1, ORE: 1, RELIC: 1 }),
    )
      .tap((s) =>
        expect(computeRecruitableTroops(s.planets[0], s.players[0].hand)).toBe(
          2,
        ),
      )
      .thru((s) => applyRecruitTroops(s, { playerId: 0, planetId: 0 }))
      .tap((after) => expect(after.planets[0].troops).toBe(2))
      .tap((after) => expect(after.players[0].hand.RELIC).toBe(0))
      .thru(noop)
      .value());
});

describe('shield defense: +4/+8/+16, unpowered L3 falls back to +8', () => {
  it.each([
    [0, 0],
    [1, 4],
    [2, 8],
    [3, 16],
  ])('level %i projects +%i', (level, defense) =>
    expect(
      computeShieldDefense(
        planet(
          0,
          0,
          match(level)
            .with(0, () => ({}))
            .otherwise(() => ({ SHIELD: level })),
        ),
      ),
    ).toBe(defense),
  );

  it('an unpowered L3 shield projects only +8', () =>
    expect(computeShieldDefense(planet(0, 0, { SHIELD: 3 }, true))).toBe(8));
});

describe('L3 shield upkeep: 2💎 per turn or the shield runs unpowered', () => {
  it('drains 2 crystals and keeps the shield powered', () =>
    chain(state([planet(0, 0, { SHIELD: 3 })], { CRYSTAL: 5 }))
      .thru((s) => doShieldUpkeep(s))
      .tap((after) => expect(after.players[0].hand.CRYSTAL).toBe(3))
      .tap((after) => expect(after.planets[0].isShieldUnpowered).toBe(false))
      .thru(noop)
      .value());

  it('marks the shield unpowered when crystals are short', () =>
    chain(state([planet(0, 0, { SHIELD: 3 })], { CRYSTAL: 1 }))
      .thru((s) => doShieldUpkeep(s))
      .tap((after) => expect(after.players[0].hand.CRYSTAL).toBe(1))
      .tap((after) => expect(after.planets[0].isShieldUnpowered).toBe(true))
      .tap((after) =>
        expect(
          after.log.some((entry) => entry.message.includes('UNPOWERED')),
        ).toBe(true),
      )
      .thru(noop)
      .value());

  it('re-powers a previously unpowered shield once upkeep is payable', () =>
    chain(state([planet(0, 0, { SHIELD: 3 }, true)], { CRYSTAL: 2 }))
      .thru((s) => doShieldUpkeep(s))
      .tap((after) => expect(after.players[0].hand.CRYSTAL).toBe(0))
      .tap((after) => expect(after.planets[0].isShieldUnpowered).toBe(false))
      .thru(noop)
      .value());

  it('shields below L3 need no upkeep', () =>
    chain(state([planet(0, 0, { SHIELD: 2 })], { CRYSTAL: 5 }))
      .thru((s) => doShieldUpkeep(s))
      .tap((after) => expect(after.players[0].hand.CRYSTAL).toBe(5))
      .tap((after) => expect(after.planets[0].isShieldUnpowered).toBe(false))
      .thru(noop)
      .value());
});
