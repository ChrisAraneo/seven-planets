import { cloneDeep } from 'lodash-es';
import { describe, expect, it } from 'vitest';

import { canPickCard } from '../functions/can-pick-card';
import { createInitialGameState } from '../functions/create-initial-game-state';
import type { GameState } from '../interfaces/game-state';
import { advance, reduce } from '../reducers/reduce';

function isParkedAtFirstPick(): GameState {
  return reduce(createInitialGameState(), { kind: 'START' });
}

function getFirstPickableIndex(state: GameState): number {
  const player = state.players[state.activeId];
  const planet = state.planets[state.draftPlanetId];
  return state.pool.findIndex((poolType) =>
    canPickCard(state, player, poolType, planet),
  );
}

describe('reduce/advance invariants', () => {
  it("parks turn 1's first pick with exactly one inputSeq bump", () => {
    const state = isParkedAtFirstPick();
    expect(state.turn).toBe(1);
    expect(state.phase).toBe('draft');
    expect(state.cursor).toMatchObject({ phase: 'draft', slot: 0, pick: 0 });
    expect(state.isAwaitingPick).toBe(true);
    expect(state.isAwaitingAction).toBe(false);
    expect(state.inputSeq).toBe(1);
    expect(state.draftPlanetId).toBeGreaterThanOrEqual(0);
  });

  it('a multi-pick slot parks once per pick (picksTotal captured at entry)', () => {
    const state = isParkedAtFirstPick();
    expect(state.cursor).toMatchObject({ phase: 'draft', picksTotal: 2 });
    const seatId = state.activeId;
    const afterPick = reduce(state, {
      kind: 'PICK_CARD',
      playerId: seatId,
      index: getFirstPickableIndex(state),
    });
    expect(afterPick.activeId).toBe(seatId);
    expect(afterPick.cursor).toMatchObject({ phase: 'draft', pick: 1 });
    expect(afterPick.isAwaitingPick).toBe(true);
    expect(afterPick.inputSeq).toBe(state.inputSeq + 1);
    expect(afterPick.pool.length).toBe(state.pool.length - 1);
  });

  it('pass slots do not park: an unpickable pool drains the draft without bumps', () => {
    const parked = isParkedAtFirstPick();
    const crafted = cloneDeep(parked);
    crafted.isAwaitingPick = false;
    crafted.pool = ['COUP', 'PEACE'];
    const resumed = advance(crafted);
    expect(resumed.turn).toBe(2);
    expect(resumed.isAwaitingPick).toBe(true);
    expect(resumed.inputSeq).toBe(parked.inputSeq + 1);
    expect(
      resumed.log.some((entry) =>
        entry.message.includes('passes (nothing pickable'),
      ),
    ).toBe(true);
  });

  it('a mid-draft game over aborts without resetting draftPlanetId', () => {
    const parked = isParkedAtFirstPick();
    const crafted = cloneDeep(parked);
    crafted.over = { winner: crafted.players[0], reason: 'conquest' };
    const resumed = reduce(crafted, {
      kind: 'PICK_CARD',
      playerId: crafted.activeId,
      index: getFirstPickableIndex(crafted),
    });
    expect(resumed.cursor).toEqual({ phase: 'done' });
    expect(resumed.isAwaitingPick).toBe(false);
    expect(resumed.activeId).toBe(-1);
    expect(resumed.draftPlanetId).toBe(parked.draftPlanetId);
    expect(resumed.pool.length).toBe(parked.pool.length);
  });

  it('illegal intents are no-ops (unchanged state identity)', () => {
    const state = isParkedAtFirstPick();
    const wrongSeat = (state.activeId + 1) % state.players.length;
    expect(
      reduce(state, { kind: 'PICK_CARD', playerId: wrongSeat, index: 0 }),
    ).toBe(state);
    expect(
      reduce(state, {
        kind: 'END_TURN',
        payload: { playerId: state.activeId },
      }),
    ).toBe(state);
    expect(
      reduce(state, { kind: 'PICK_CARD', playerId: state.activeId, index: 99 }),
    ).toBe(state);
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
    ).toBe(state);
    expect(reduce(state, { kind: 'START' })).toBe(state);
  });
});
