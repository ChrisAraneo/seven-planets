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
    .thru((state) =>
      draftSeats(
        draftOrder(state).map((player) => player.id),
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
      (player) => player.skippedNow,
      async (): Promise<DraftOutcome> => 'completed',
    )
    .otherwise(() => draftPlanetSlots(seatId, 0, hooks));
}

// One iteration per owned planet; the list is re-read live because conquests
// during the draft can change what the seat owns.
async function draftPlanetSlots(
  seatId: number,
  sum: number,
  hooks: PresentationHooks,
): Promise<DraftOutcome> {
  return match(getGameState())
    .when(
      (state) => sum >= ownedPlanets(state, state.players[seatId]).length,
      async (): Promise<DraftOutcome> => 'completed',
    )
    .when(
      () => Boolean(getOver()),
      async (): Promise<DraftOutcome> => 'aborted',
    )
    .otherwise(() =>
      draftSlot(seatId, sum, hooks).then((outcome) =>
        match(outcome)
          .with('aborted', async (): Promise<DraftOutcome> => 'aborted')
          .otherwise(() => draftPlanetSlots(seatId, sum + 1, hooks)),
      ),
    );
}

async function draftSlot(
  seatId: number,
  sum: number,
  hooks: PresentationHooks,
): Promise<DraftOutcome> {
  return match(getGameState())
    .when(
      (state) => !state.players[seatId].isAlive || state.pool.length === 0,
      async (): Promise<DraftOutcome> => 'completed',
    )
    .otherwise((state) =>
      chain({
        planetId: ownedPlanets(state, state.players[seatId])[sum].id,
        picks: match(sum)
          .with(0, () => mainPicks(state, state.players[seatId]))
          .otherwise((): number => 1),
      })
        .tap(({ planetId }) =>
          Object.assign(state, { activeId: seatId, draftPlanetId: planetId }),
        )
        .thru(({ planetId, picks }) =>
          draftPicks(seatId, sum, planetId, picks, 0, hooks),
        )
        .value(),
    );
}

async function draftPicks(
  seatId: number,
  sum: number,
  planetId: number,
  picks: number,
  counter: number,
  hooks: PresentationHooks,
): Promise<DraftOutcome> {
  return match(getGameState())
    .when(
      (state) => counter >= picks || state.pool.length === 0,
      async (): Promise<DraftOutcome> => 'completed',
    )
    .otherwise((state) =>
      draftOnePick(state, seatId, sum, planetId, picks, counter, hooks).then(
        (outcome) =>
          match(outcome)
            .with('aborted', async (): Promise<DraftOutcome> => 'aborted')
            .otherwise(() =>
              draftPicks(seatId, sum, planetId, picks, counter + 1, hooks),
            ),
      ),
    );
}

async function draftOnePick(
  state: GameState,
  seatId: number,
  sum: number,
  planetId: number,
  picks: number,
  counter: number,
  hooks: PresentationHooks,
): Promise<DraftOutcome> {
  return chain({
    p: state.players[seatId],
    planet: state.planets[planetId],
    humanControlled: state.players[seatId].isHuman && !AUTO_HUMAN,
  })
    .thru(({ p: player, planet, humanControlled }) =>
      match(
        state.pool.some((poolType) =>
          canPickCard(state, player, poolType, planet),
        ),
      )
        .with(false, () =>
          passSlot(state, player, planet, humanControlled, hooks),
        )
        .otherwise(() =>
          promptAndPick(
            state,
            seatId,
            sum,
            planetId,
            picks,
            counter,
            humanControlled,
            hooks,
          ),
        ),
    )
    .value();
}

async function passSlot(
  state: GameState,
  player: Player,
  planet: Planet,
  humanControlled: boolean,
  hooks: PresentationHooks,
): Promise<DraftOutcome> {
  return chain(state)
    .tap((state) =>
      match(humanControlled)
        .with(
          true,
          () =>
            void Object.assign(
              state,
              setStatus(state, `No card you can take — ${planet.name} passes.`),
            ),
        )
        .otherwise(noop),
    )
    .tap((state) =>
      Object.assign(
        state,
        log(
          state,
          `🃏 ${player.name} passes (nothing pickable for ${planet.name})`,
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
  sum: number,
  planetId: number,
  picks: number,
  counter: number,
  humanControlled: boolean,
  hooks: PresentationHooks,
): Promise<DraftOutcome> {
  return (
    chain(state)
      .tap((state) =>
        Object.assign(
          state,
          setStatus(
            state,
            pickStatus(
              state,
              seatId,
              planetId,
              picks,
              counter,
              sum,
              humanControlled,
            ),
          ),
        ),
      )
      .thru((state) =>
        match(humanControlled)
          .with(false, () => hooks.sleep(300)) // Let the AI's draft read at a human pace.
          .otherwise(async (): Promise<void> => undefined),
      )
      .value()
      // Raise awaitingPick and wait for the pick (human click or AI module).
      .then(() => waitPoolPick(getGameState()))
      .then((index) =>
        match(Boolean(getOver()))
          .with(true, (): DraftOutcome => 'aborted')
          .otherwise(() => applyPick(index, seatId, sum, planetId, hooks)),
      )
  );
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
  hooks: PresentationHooks,
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
            applyBuildingPick(
              state,
              player,
              planet,
              poolType as BuildingType,
              hooks,
            ),
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
  hooks: PresentationHooks,
): DraftOutcome {
  return chain(
    Object.assign(
      state,
      buildBuilding(state, player.id, planet.id, buildingType, hooks),
    ),
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
    Object.assign(player, {
      influence: player.influence - INFLUENCE_CARDS[influenceType].cost,
      hand: { ...player.hand, [influenceType]: player.hand[influenceType] + 1 },
    }),
  )
    .tap(() =>
      Object.assign(
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
    Object.assign(player, {
      hand: { ...player.hand, [type]: player.hand[type] + 1 },
    }),
  )
    .tap(() =>
      Object.assign(
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
