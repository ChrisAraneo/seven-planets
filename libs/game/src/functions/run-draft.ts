import { assign, chain, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { getOver } from '../getters/get-over';
import { CARDS, INFLUENCE_CARDS } from '../config/constants';
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
import type { EngineGen } from './engine-driver';

/* 'aborted' = the game ended mid-draft; unwinding stops immediately and the
   draft-planet marker is deliberately left as-is (matching the old early return). */
type DraftOutcome = 'completed' | 'aborted';

/* Every seat drafts through the same suspended `pick` action. We raise
   `awaitingPick` (bumping inputSeq) and suspend: the human answers with a
   pool click; an AI seat is answered by the AI, which WATCHES inputSeq on
   the state — both dispatch the same `pickCard` action. Pacing is the
   answerer's concern — the engine itself never waits on time. Because the
   `pickCard` mutation clones and replaces the state object, we never hold
   a state/entity reference across a suspension — everything is re-read
   from getGameState() by id. */
export function* runDraft(): EngineGen {
  assign(getGameState(), { phase: 'draft' });
  const seatIds = draftOrder(getGameState()).map((player) => player.id);
  const outcome = yield* draftSeats(seatIds);
  if (outcome === 'completed') {
    assign(getGameState(), { draftPlanetId: -1 });
  }
}

function* draftSeats(seatIds: number[]): EngineGen<DraftOutcome> {
  for (const seatId of seatIds) {
    const outcome = yield* draftSeat(seatId);
    if (outcome === 'aborted') {
      return 'aborted';
    }
  }
  return 'completed';
}

function* draftSeat(seatId: number): EngineGen<DraftOutcome> {
  // Paralysed by an influence card
  if (getGameState().players[seatId].skippedNow) {
    return 'completed';
  }
  return yield* draftPlanetSlots(seatId);
}

// One iteration per owned planet; the list is re-read live because conquests
// during the draft can change what the seat owns.
function* draftPlanetSlots(seatId: number): EngineGen<DraftOutcome> {
  let sum = 0;
  for (;;) {
    const state = getGameState();
    if (sum >= ownedPlanets(state, state.players[seatId]).length) {
      return 'completed';
    }
    if (getOver()) {
      return 'aborted';
    }
    const outcome = yield* draftSlot(seatId, sum);
    if (outcome === 'aborted') {
      return 'aborted';
    }
    sum++;
  }
}

function* draftSlot(seatId: number, sum: number): EngineGen<DraftOutcome> {
  const state = getGameState();
  if (!state.players[seatId].isAlive || state.pool.length === 0) {
    return 'completed';
  }
  const planetId = ownedPlanets(state, state.players[seatId])[sum].id;
  const picks = match(sum)
    .with(0, () => mainPicks(state, state.players[seatId]))
    .otherwise((): number => 1);
  assign(state, { activeId: seatId, draftPlanetId: planetId });
  return yield* draftPicks(seatId, sum, planetId, picks);
}

function* draftPicks(
  seatId: number,
  sum: number,
  planetId: number,
  picks: number,
): EngineGen<DraftOutcome> {
  for (let counter = 0; counter < picks; counter++) {
    const state = getGameState();
    if (state.pool.length === 0) {
      return 'completed';
    }
    const outcome = yield* draftOnePick(state, seatId, sum, planetId, picks, counter);
    if (outcome === 'aborted') {
      return 'aborted';
    }
  }
  return 'completed';
}

function* draftOnePick(
  state: GameState,
  seatId: number,
  sum: number,
  planetId: number,
  picks: number,
  counter: number,
): EngineGen<DraftOutcome> {
  const player = state.players[seatId];
  const planet = state.planets[planetId];
  const humanControlled = player.isHuman && !AUTO_HUMAN;
  const pickable = state.pool.some((poolType) =>
    canPickCard(state, player, poolType, planet),
  );
  if (!pickable) {
    return passSlot(state, player, planet, humanControlled);
  }
  return yield* promptAndPick(state, seatId, sum, planetId, picks, counter, humanControlled);
}

function passSlot(
  state: GameState,
  player: Player,
  planet: Planet,
  humanControlled: boolean,
): DraftOutcome {
  return chain(state)
    .tap((state) =>
      match(humanControlled)
        .with(
          true,
          () =>
            void assign(
              state,
              setStatus(state, `No card you can take — ${planet.name} passes.`),
            ),
        )
        .otherwise(noop),
    )
    .tap((state) =>
      assign(
        state,
        log(
          state,
          `🃏 ${player.name} passes (nothing pickable for ${planet.name})`,
          'draft',
        ),
      ),
    )
    .thru((): DraftOutcome => 'completed')
    .value();
}

function* promptAndPick(
  state: GameState,
  seatId: number,
  sum: number,
  planetId: number,
  picks: number,
  counter: number,
  humanControlled: boolean,
): EngineGen<DraftOutcome> {
  assign(
    state,
    setStatus(
      state,
      pickStatus(state, seatId, planetId, picks, counter, sum, humanControlled),
    ),
  );
  // Raise awaitingPick on the live state and suspend for the pick (human
  // click, or the AI's watcher on inputSeq), which resumes us with the
  // chosen pool index.
  const live = getGameState();
  assign(live, { awaitingPick: true, inputSeq: live.inputSeq + 1 });
  const index = (yield { kind: 'pick' }) ?? 0;
  if (getOver()) {
    return 'aborted';
  }
  return applyPick(index, seatId, sum, planetId);
}

function pickStatus(
  state: GameState,
  seatId: number,
  planetId: number,
  picks: number,
  counter: number,
  sum: number,
  humanControlled: boolean,
): string {
  return match(humanControlled)
    .with(
      true,
      () =>
        `YOUR PICK — ${state.planets[planetId].name} drafts card ${counter + 1} of ${picks}${extraTurnSuffix(sum)}`,
    )
    .otherwise(
      () =>
        `${state.players[seatId].name} is drafting for ${state.planets[planetId].name}…`,
    );
}

function extraTurnSuffix(sum: number): string {
  return match(sum)
    .when(
      (count) => count > 0,
      () => ' (extra planet turn)',
    )
    .otherwise(() => '');
}

// The pick mutation replaced the state object — re-read by id.
function applyPick(
  index: number,
  seatId: number,
  sum: number,
  planetId: number,
): DraftOutcome {
  return chain(getGameState())
    .thru((state) => ({
      st: state,
      p: state.players[seatId],
      pl: state.planets[planetId],
      type: state.pool.splice(index, 1)[0],
    }))
    .thru(({ st: state, p: player, pl: planet, type }) =>
      match(type)
        .when(
          (poolType) => Boolean(CARDS[poolType].building),
          (poolType) =>
            applyBuildingPick(state, player, planet, poolType as BuildingType),
        )
        .when(
          (poolType) => Boolean(CARDS[poolType].influenceCard),
          (poolType) =>
            applyInfluencePick(state, player, poolType as InfluenceType),
        )
        .otherwise((poolType) =>
          applyCardPick(state, player, planet, poolType, sum),
        ),
    )
    .value();
}

// Pays cost from hand, may win the game
function applyBuildingPick(
  state: GameState,
  player: Player,
  planet: Planet,
  buildingType: BuildingType,
): DraftOutcome {
  return chain(
    assign(state, buildBuilding(state, player.id, planet.id, buildingType)),
  )
    .thru(() =>
      match(Boolean(getOver()))
        .with(true, (): DraftOutcome => 'aborted')
        .otherwise((): DraftOutcome => 'completed'),
    )
    .value();
}

function applyInfluencePick(
  state: GameState,
  player: Player,
  influenceType: InfluenceType,
): DraftOutcome {
  return chain(
    assign(player, {
      influence: player.influence - INFLUENCE_CARDS[influenceType].cost,
      hand: { ...player.hand, [influenceType]: player.hand[influenceType] + 1 },
    }),
  )
    .tap(() =>
      assign(
        state,
        log(
          state,
          `⭐ ${player.name} drafts ${CARDS[influenceType].icon} ${CARDS[influenceType].name} (−${INFLUENCE_CARDS[influenceType].cost}⭐) — holds it for a later action turn`,
          'draft',
        ),
      ),
    )
    .thru((): DraftOutcome => 'completed')
    .value();
}

function applyCardPick(
  state: GameState,
  player: Player,
  planet: Planet,
  type: PoolType,
  sum: number,
): DraftOutcome {
  return chain(
    assign(player, {
      hand: { ...player.hand, [type]: player.hand[type] + 1 },
    }),
  )
    .tap(() =>
      assign(
        state,
        log(
          state,
          `🃏 ${player.name} drafts ${CARDS[type].icon} ${CARDS[type].name}${planetTurnSuffix(planet, sum)}`,
          'draft',
        ),
      ),
    )
    .thru((): DraftOutcome => 'completed')
    .value();
}

function planetTurnSuffix(planet: Planet, sum: number): string {
  return match(sum)
    .when(
      (count) => count > 0,
      () => ` (${planet.name}'s turn)`,
    )
    .otherwise(() => '');
}
