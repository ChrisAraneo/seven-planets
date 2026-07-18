import { assign, cloneDeep, noop } from 'lodash-es';
import { describe, expect, it } from 'vitest';

import { canPickCard } from '../functions/can-pick-card';
import { createInitialGameState } from '../functions/create-initial-game-state';
import type { GameState } from '../interfaces/game-state';
import { advance } from '../reducers/advance';
import { reduce } from '../reducers/reduce';
import { chain } from '../utils/chain';

const isParkedAtFirstPick = (): GameState =>
  reduce(createInitialGameState(), { kind: 'START' });

const getFirstPickableIndex = (state: GameState): number =>
  state.pool.findIndex((poolType) =>
    canPickCard(
      state,
      state.players[state.activeId],
      poolType,
      state.planets[state.draftPlanetId],
    ),
  );

describe('reduce/advance invariants', () => {
  it("parks turn 1's first pick with exactly 1 inputSeq bump", () =>
    chain(isParkedAtFirstPick())
      .tap((state) => expect(state.turn).toBe(1))
      .tap((state) => expect(state.phase).toBe('draft'))
      .tap((state) =>
        expect(state.cursor).toMatchObject({
          phase: 'draft',
          slot: 0,
          pick: 0,
        }),
      )
      .tap((state) => expect(state.isAwaitingPick).toBe(true))
      .tap((state) => expect(state.isAwaitingAction).toBe(false))
      .tap((state) => expect(state.inputSeq).toBe(1))
      .tap((state) => expect(state.draftPlanetId).toBeGreaterThanOrEqual(0))
      .thru(noop)
      .value());

  it('a multi-pick slot parks once per pick (picksTotal captured at entry)', () =>
    chain(isParkedAtFirstPick())
      .tap((state) =>
        expect(state.cursor).toMatchObject({ phase: 'draft', picksTotal: 2 }),
      )
      .thru((state) => ({
        state,
        seatId: state.activeId,
        afterPick: reduce(state, {
          kind: 'PICK_CARD',
          playerId: state.activeId,
          index: getFirstPickableIndex(state),
        }),
      }))
      .tap(({ seatId, afterPick }) => expect(afterPick.activeId).toBe(seatId))
      .tap(({ afterPick }) =>
        expect(afterPick.cursor).toMatchObject({ phase: 'draft', pick: 1 }),
      )
      .tap(({ afterPick }) => expect(afterPick.isAwaitingPick).toBe(true))
      .tap(({ state, afterPick }) =>
        expect(afterPick.inputSeq).toBe(state.inputSeq + 1),
      )
      .tap(({ state, afterPick }) =>
        expect(afterPick.pool.length).toBe(state.pool.length - 1),
      )
      .thru(noop)
      .value());

  it('pass slots do not park: an unpickable pool drains the draft without bumps', () =>
    chain(isParkedAtFirstPick())
      .thru((parked) => ({ parked, crafted: cloneDeep(parked) }))
      .tap(({ crafted }) =>
        assign(crafted, { isAwaitingPick: false, pool: ['COUP', 'PEACE'] }),
      )
      .thru(({ parked, crafted }) => ({ parked, resumed: advance(crafted) }))
      .tap(({ resumed }) => expect(resumed.turn).toBe(2))
      .tap(({ resumed }) => expect(resumed.isAwaitingPick).toBe(true))
      .tap(({ parked, resumed }) =>
        expect(resumed.inputSeq).toBe(parked.inputSeq + 1),
      )
      .tap(({ resumed }) =>
        expect(
          resumed.log.some((entry) =>
            entry.message.includes('passes (nothing pickable'),
          ),
        ).toBe(true),
      )
      .thru(noop)
      .value());

  it('a mid-draft game over aborts without resetting draftPlanetId', () =>
    chain(isParkedAtFirstPick())
      .thru((parked) => ({ parked, crafted: cloneDeep(parked) }))
      .tap(({ crafted }) =>
        assign(crafted, {
          over: { winner: crafted.players[0], reason: 'conquest' },
        }),
      )
      .thru(({ parked, crafted }) => ({
        parked,
        resumed: reduce(crafted, {
          kind: 'PICK_CARD',
          playerId: crafted.activeId,
          index: getFirstPickableIndex(crafted),
        }),
      }))
      .tap(({ resumed }) => expect(resumed.cursor).toEqual({ phase: 'd1' }))
      .tap(({ resumed }) => expect(resumed.isAwaitingPick).toBe(false))
      .tap(({ resumed }) => expect(resumed.activeId).toBe(-1))
      .tap(({ parked, resumed }) =>
        expect(resumed.draftPlanetId).toBe(parked.draftPlanetId),
      )
      .tap(({ parked, resumed }) =>
        expect(resumed.pool.length).toBe(parked.pool.length),
      )
      .thru(noop)
      .value());

  it('illegal intents are no-ops (unchanged state identity)', () =>
    chain(isParkedAtFirstPick())
      .thru((state) => ({
        state,
        wrongSeat: (state.activeId + 1) % state.players.length,
      }))
      .tap(({ state, wrongSeat }) =>
        expect(
          reduce(state, { kind: 'PICK_CARD', playerId: wrongSeat, index: 0 }),
        ).toBe(state),
      )
      .tap(({ state }) =>
        expect(
          reduce(state, {
            kind: 'END_TURN',
            payload: { playerId: state.activeId },
          }),
        ).toBe(state),
      )
      .tap(({ state }) =>
        expect(
          reduce(state, {
            kind: 'PICK_CARD',
            playerId: state.activeId,
            index: 99,
          }),
        ).toBe(state),
      )
      .tap(({ state, wrongSeat }) =>
        expect(
          reduce(state, {
            kind: 'ATTACK_PLANET',
            payload: {
              playerId: wrongSeat,
              sourceId: 0,
              targetId: 1,
              troops: 1,
            },
          }),
        ).toBe(state),
      )
      .tap(({ state }) => expect(reduce(state, { kind: 'START' })).toBe(state))
      .thru(noop)
      .value());
});
