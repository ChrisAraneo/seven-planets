import { chain, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { getOver } from '../getters/get-over';
import { CARDS, INFLUENCE_CARDS, NO_PRESENTATION } from '../config/constants';
import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import type { InfluenceType } from '../interfaces/influence-type';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import type { PoolType } from '../interfaces/pool-type';
import { getGameState } from '../game-state';

import { AUTO_HUMAN } from './auto-human';
import { buildBuilding } from './build-building';
import { canPickCard } from './can-pick-card';
import { draftOrder } from './draft-order';
import { log } from './log';
import { mainPicks } from './main-picks';
import { setStatus } from './set-status';
import { ownedPlanets } from './owned-planets';
import { waitPoolPick } from './wait-pool-pick';
import type { PresentationHooks } from '../interfaces/presentation-hooks';

/* 'aborted' = the game ended mid-draft; unwinding stops immediately and the
   draft-planet marker is deliberately left as-is (matching the old early return). */
type DraftOutcome = 'completed' | 'aborted';

/* Every seat drafts through the same parked `pick` store action. We raise
   `awaitingPick` and wait: the human answers with a pool click; an AI seat
   is answered by the `ai` store module, which watches the flag and dispatches
   the same `pickCard` action. Because the `pickCard` mutation clones and
   replaces the state object, we never hold a state/entity reference across an
   await — everything is re-read from getGameState() by id. */
export async function runDraft(
  hooks: PresentationHooks = NO_PRESENTATION,
): Promise<void> {
  return chain(Object.assign(getGameState(), { phase: 'draft' }))
    .thru((s) =>
      draftSeats(
        draftOrder(s).map((pl) => pl.id),
        hooks,
      ),
    )
    .value()
    .then((outcome) =>
      match(outcome)
        .with(
          'completed',
          () => void Object.assign(getGameState(), { draftPlanetId: -1 }),
        )
        .otherwise(noop),
    );
}

async function draftSeats(
  seatIds: number[],
  hooks: PresentationHooks,
): Promise<DraftOutcome> {
  return match(seatIds)
    .when(
      (ids) => ids.length === 0,
      async (): Promise<DraftOutcome> => 'completed',
    )
    .otherwise(([seatId, ...rest]) =>
      draftSeat(seatId, hooks).then((outcome) =>
        match(outcome)
          .with('aborted', async (): Promise<DraftOutcome> => 'aborted')
          .otherwise(() => draftSeats(rest, hooks)),
      ),
    );
}

async function draftSeat(
  seatId: number,
  hooks: PresentationHooks,
): Promise<DraftOutcome> {
  return match(getGameState().players[seatId])
    .when(
      // Paralysed by an influence card
      (p) => p.skippedNow,
      async (): Promise<DraftOutcome> => 'completed',
    )
    .otherwise(() => draftPlanetSlots(seatId, 0, hooks));
}

// One iteration per owned planet; the list is re-read live because conquests
// during the draft can change what the seat owns.
async function draftPlanetSlots(
  seatId: number,
  s: number,
  hooks: PresentationHooks,
): Promise<DraftOutcome> {
  return match(getGameState())
    .when(
      (st) => s >= ownedPlanets(st, st.players[seatId]).length,
      async (): Promise<DraftOutcome> => 'completed',
    )
    .when(
      () => Boolean(getOver()),
      async (): Promise<DraftOutcome> => 'aborted',
    )
    .otherwise(() =>
      draftSlot(seatId, s, hooks).then((outcome) =>
        match(outcome)
          .with('aborted', async (): Promise<DraftOutcome> => 'aborted')
          .otherwise(() => draftPlanetSlots(seatId, s + 1, hooks)),
      ),
    );
}

async function draftSlot(
  seatId: number,
  s: number,
  hooks: PresentationHooks,
): Promise<DraftOutcome> {
  return match(getGameState())
    .when(
      (st) => !st.players[seatId].isAlive || st.pool.length === 0,
      async (): Promise<DraftOutcome> => 'completed',
    )
    .otherwise((st) =>
      chain({
        planetId: ownedPlanets(st, st.players[seatId])[s].id,
        picks: match(s)
          .with(0, () => mainPicks(st, st.players[seatId]))
          .otherwise((): number => 1),
      })
        .tap(({ planetId }) =>
          Object.assign(st, { activeId: seatId, draftPlanetId: planetId }),
        )
        .thru(({ planetId, picks }) =>
          draftPicks(seatId, s, planetId, picks, 0, hooks),
        )
        .value(),
    );
}

async function draftPicks(
  seatId: number,
  s: number,
  planetId: number,
  picks: number,
  k: number,
  hooks: PresentationHooks,
): Promise<DraftOutcome> {
  return match(getGameState())
    .when(
      (st) => k >= picks || st.pool.length === 0,
      async (): Promise<DraftOutcome> => 'completed',
    )
    .otherwise((st) =>
      draftOnePick(st, seatId, s, planetId, picks, k, hooks).then((outcome) =>
        match(outcome)
          .with('aborted', async (): Promise<DraftOutcome> => 'aborted')
          .otherwise(() =>
            draftPicks(seatId, s, planetId, picks, k + 1, hooks),
          ),
      ),
    );
}

async function draftOnePick(
  state: GameState,
  seatId: number,
  s: number,
  planetId: number,
  picks: number,
  k: number,
  hooks: PresentationHooks,
): Promise<DraftOutcome> {
  return chain({
    p: state.players[seatId],
    planet: state.planets[planetId],
    humanControlled: state.players[seatId].isHuman && !AUTO_HUMAN,
  })
    .thru(({ p, planet, humanControlled }) =>
      match(state.pool.some((t) => canPickCard(state, p, t, planet)))
        .with(false, () => passSlot(state, p, planet, humanControlled, hooks))
        .otherwise(() =>
          promptAndPick(
            state,
            seatId,
            s,
            planetId,
            picks,
            k,
            humanControlled,
            hooks,
          ),
        ),
    )
    .value();
}

async function passSlot(
  state: GameState,
  p: Player,
  planet: Planet,
  humanControlled: boolean,
  hooks: PresentationHooks,
): Promise<DraftOutcome> {
  return chain(state)
    .tap((st) =>
      match(humanControlled)
        .with(
          true,
          () =>
            void Object.assign(
              st,
              setStatus(st, `No card you can take — ${planet.name} passes.`),
            ),
        )
        .otherwise(noop),
    )
    .tap((st) =>
      Object.assign(
        st,
        log(
          st,
          `🃏 ${p.name} passes (nothing pickable for ${planet.name})`,
          'draft',
        ),
      ),
    )
    .thru(() =>
      hooks.sleep(
        match(humanControlled)
          .with(true, (): number => 600)
          .otherwise((): number => 300),
      ),
    )
    .value()
    .then((): DraftOutcome => 'completed');
}

async function promptAndPick(
  state: GameState,
  seatId: number,
  s: number,
  planetId: number,
  picks: number,
  k: number,
  humanControlled: boolean,
  hooks: PresentationHooks,
): Promise<DraftOutcome> {
  return (
    chain(state)
      .tap((st) =>
        Object.assign(
          st,
          setStatus(
            st,
            pickStatus(st, seatId, planetId, picks, k, s, humanControlled),
          ),
        ),
      )
      .thru((st) =>
        match(humanControlled)
          .with(false, () => hooks.sleep(300)) // Let the AI's draft read at a human pace.
          .otherwise(async (): Promise<void> => undefined),
      )
      .value()
      // Raise awaitingPick and wait for the pick (human click or AI module).
      .then(() => waitPoolPick(getGameState()))
      .then((idx) =>
        match(Boolean(getOver()))
          .with(true, (): DraftOutcome => 'aborted')
          .otherwise(() => applyPick(idx, seatId, s, planetId, hooks)),
      )
  );
}

function pickStatus(
  state: GameState,
  seatId: number,
  planetId: number,
  picks: number,
  k: number,
  s: number,
  humanControlled: boolean,
): string {
  return match(humanControlled)
    .with(
      true,
      () =>
        `YOUR PICK — ${state.planets[planetId].name} drafts card ${k + 1} of ${picks}${extraTurnSuffix(s)}`,
    )
    .otherwise(
      () =>
        `${state.players[seatId].name} is drafting for ${state.planets[planetId].name}…`,
    );
}

function extraTurnSuffix(s: number): string {
  return match(s)
    .when(
      (n) => n > 0,
      () => ' (extra planet turn)',
    )
    .otherwise(() => '');
}

// The pick mutation replaced the state object — re-read by id.
function applyPick(
  idx: number,
  seatId: number,
  s: number,
  planetId: number,
  hooks: PresentationHooks,
): DraftOutcome {
  return chain(getGameState())
    .thru((st) => ({
      st,
      p: st.players[seatId],
      pl: st.planets[planetId],
      type: st.pool.splice(idx, 1)[0],
    }))
    .thru(({ st, p, pl, type }) =>
      match(type)
        .when(
          (t) => Boolean(CARDS[t].building),
          (t) => applyBuildingPick(st, p, pl, t as BuildingType, hooks),
        )
        .when(
          (t) => Boolean(CARDS[t].influenceCard),
          (t) => applyInfluencePick(st, p, t as InfluenceType),
        )
        .otherwise((t) => applyCardPick(st, p, pl, t, s)),
    )
    .value();
}

// Pays cost from hand, may win the game
function applyBuildingPick(
  st: GameState,
  p: Player,
  pl: Planet,
  buildingType: BuildingType,
  hooks: PresentationHooks,
): DraftOutcome {
  return chain(
    Object.assign(st, buildBuilding(st, p.id, pl.id, buildingType, hooks)),
  )
    .thru(() =>
      match(Boolean(getOver()))
        .with(true, (): DraftOutcome => 'aborted')
        .otherwise((): DraftOutcome => 'completed'),
    )
    .value();
}

function applyInfluencePick(
  st: GameState,
  p: Player,
  influenceType: InfluenceType,
): DraftOutcome {
  return chain(
    Object.assign(p, {
      influence: p.influence - INFLUENCE_CARDS[influenceType].cost,
      hand: { ...p.hand, [influenceType]: p.hand[influenceType] + 1 },
    }),
  )
    .tap(() =>
      Object.assign(
        st,
        log(
          st,
          `⭐ ${p.name} drafts ${CARDS[influenceType].icon} ${CARDS[influenceType].name} (−${INFLUENCE_CARDS[influenceType].cost}⭐) — holds it for a later action turn`,
          'draft',
        ),
      ),
    )
    .thru((): DraftOutcome => 'completed')
    .value();
}

function applyCardPick(
  st: GameState,
  p: Player,
  pl: Planet,
  type: PoolType,
  s: number,
): DraftOutcome {
  return chain(
    Object.assign(p, { hand: { ...p.hand, [type]: p.hand[type] + 1 } }),
  )
    .tap(() =>
      Object.assign(
        st,
        log(
          st,
          `🃏 ${p.name} drafts ${CARDS[type].icon} ${CARDS[type].name}${planetTurnSuffix(pl, s)}`,
          'draft',
        ),
      ),
    )
    .thru((): DraftOutcome => 'completed')
    .value();
}

function planetTurnSuffix(pl: Planet, s: number): string {
  return match(s)
    .when(
      (n) => n > 0,
      () => ` (${pl.name}'s turn)`,
    )
    .otherwise(() => '');
}
