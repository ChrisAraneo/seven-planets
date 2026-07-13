/* The engine as a pure fold: these pin the behavioral invariants the old
   generator encoded implicitly (see OBSERVABLE-ENGINE-PLAN §7). reduce and
   advance are pure w.r.t. their arguments, so every case runs on crafted
   states with no stream, no store and no AI seated. */
import { cloneDeep } from 'lodash-es';
import { describe, expect, it } from 'vitest';

import { canPickCard } from '../functions/can-pick-card';
import { initializeState } from '../functions/initialize-state';
import type { GameState } from '../interfaces/game-state';
import { advance, reduce } from '../reducers/reduce';

/** Start a fresh game and return it parked at turn 1's first draft pick. */
function parkedAtFirstPick(): GameState {
  return reduce(initializeState(), { kind: 'start' });
}

function firstPickableIdx(state: GameState): number {
  const player = state.players[state.activeId];
  const planet = state.planets[state.draftPlanetId];
  return state.pool.findIndex((poolType) =>
    canPickCard(state, player, poolType, planet),
  );
}

describe('reduce/advance invariants', () => {
  it("parks turn 1's first pick with exactly one inputSeq bump", () => {
    const state = parkedAtFirstPick();
    expect(state.turn).toBe(1);
    expect(state.phase).toBe('draft');
    expect(state.cursor).toMatchObject({ phase: 'draft', slot: 0, pick: 0 });
    expect(state.awaitingPick).toBe(true);
    expect(state.awaitingAction).toBe(false);
    expect(state.inputSeq).toBe(1);
    expect(state.draftPlanetId).toBeGreaterThanOrEqual(0);
  });

  it('a multi-pick slot parks once per pick (picksTotal captured at entry)', () => {
    const state = parkedAtFirstPick();
    // Slot 0 drafts mainPicks = 2 cards at game start.
    expect(state.cursor).toMatchObject({ phase: 'draft', picksTotal: 2 });
    const seatId = state.activeId;
    const afterPick = reduce(state, {
      kind: 'pick',
      playerId: seatId,
      idx: firstPickableIdx(state),
    });
    // Same seat, same slot, second pick — one fresh park, one fresh bump.
    expect(afterPick.activeId).toBe(seatId);
    expect(afterPick.cursor).toMatchObject({ phase: 'draft', pick: 1 });
    expect(afterPick.awaitingPick).toBe(true);
    expect(afterPick.inputSeq).toBe(state.inputSeq + 1);
    expect(afterPick.pool.length).toBe(state.pool.length - 1);
  });

  it('pass slots do not park: an unpickable pool drains the draft without bumps', () => {
    const parked = parkedAtFirstPick();
    const crafted = cloneDeep(parked);
    /* Influence cards nobody can afford (everyone starts at 0⭐): nothing
       is pickable for any seat, so every slot passes. */
    crafted.awaitingPick = false;
    crafted.pool = ['COUP', 'PEACE'];
    const resumed = advance(crafted);
    /* The whole turn-1 draft passed through (plus the skipped pre-action
       phase) and the game next parks at turn 2's first pick — a single
       inputSeq bump for that one park, none for the passes. */
    expect(resumed.turn).toBe(2);
    expect(resumed.awaitingPick).toBe(true);
    expect(resumed.inputSeq).toBe(parked.inputSeq + 1);
    expect(
      resumed.log.some((entry) =>
        entry.msg.includes('passes (nothing pickable'),
      ),
    ).toBe(true);
  });

  it('a mid-draft game over aborts without resetting draftPlanetId', () => {
    const parked = parkedAtFirstPick();
    const crafted = cloneDeep(parked);
    crafted.over = { winner: crafted.players[0], reason: 'conquest' };
    const resumed = reduce(crafted, {
      kind: 'pick',
      playerId: crafted.activeId,
      idx: firstPickableIdx(crafted),
    });
    /* The park is consumed but the answer is discarded (no card applied),
       and the draft-planet marker survives the abort (§ the old early return). */
    expect(resumed.cursor).toEqual({ phase: 'done' });
    expect(resumed.awaitingPick).toBe(false);
    expect(resumed.activeId).toBe(-1);
    expect(resumed.draftPlanetId).toBe(parked.draftPlanetId);
    expect(resumed.pool.length).toBe(parked.pool.length);
  });

  it('illegal intents are no-ops (unchanged state identity)', () => {
    const state = parkedAtFirstPick();
    const wrongSeat = (state.activeId + 1) % state.players.length;
    /* Not this seat's pick; not an action turn; invalid pick index; attack
       during the draft; a second 'start'. */
    expect(reduce(state, { kind: 'pick', playerId: wrongSeat, idx: 0 })).toBe(
      state,
    );
    expect(reduce(state, { kind: 'endTurn', playerId: state.activeId })).toBe(
      state,
    );
    expect(
      reduce(state, { kind: 'pick', playerId: state.activeId, idx: 99 }),
    ).toBe(state);
    expect(
      reduce(state, {
        kind: 'attack',
        payload: {
          playerId: wrongSeat,
          sourceId: 0,
          targetId: 1,
          troops: 1,
        },
      }),
    ).toBe(state);
    expect(reduce(state, { kind: 'start' })).toBe(state);
  });
});
