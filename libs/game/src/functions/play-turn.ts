import { assign, chain, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { getOver } from '../getters/get-over';
import { getSingularityAnnounced } from '../getters/get-singularity-announced';
import {
  ACTION_CARDS_FROM_TURN,
  ADVANCED_FROM_TURN,
  BUILDINGS_FROM_TURN,
  choice,
  MOVE_CARDS_FROM_TURN,
  NO_PRESENTATION,
} from '../config/constants';
import { getGameState } from '../game-state';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { filterAlivePlayers } from './filter-alive-players';
import { doIncome } from './do-income';
import { draftOrder } from './draft-order';
import { isSingularityInPlay } from './is-singularity-in-play';
import { log } from './log';
import { makePool } from './make-pool';
import { runActionPhase } from '../functions/run-action-phase';
import { runDraft } from '../functions/run-draft';
import { updatePacifistStatus } from './update-pacifist-status';
import type { PresentationHooks } from '../interfaces/presentation-hooks';

export async function playTurn(
  hooks: PresentationHooks = NO_PRESENTATION,
): Promise<void> {
  // The prelude is synchronous — no store mutation reassigns the state
  // object here — so one reference is safe until the first `await`.
  return chain(getGameState())
    .tap((state) => assign(state, { turn: state.turn + 1 }))
    .tap((state) =>
      state.players.forEach((player) => beginPlayerTurn(state, player)),
    )
    .tap((state) => assign(state, updatePacifistStatus(state, hooks)))
    .tap((state) => assign(state, doIncome(state)))
    .tap((state) => announceSingularity(state))
    .tap((state) =>
      assign(state, {
        pool: makePool(state),
        startIdx: choice(filterAlivePlayers(state)).id,
      }),
    )
    .tap((state) =>
      assign(
        state,
        log(
          state,
          `— TURN ${state.turn} — ${draftOrder(state)[0].name} drafts first${turnFlavor(state.turn)}`,
          'sys',
        ),
      ),
    )
    .tap((state) => assign(state, milestoneLogs(state)))
    .thru(() => runDraft(hooks))
    .value()
    .then(() => afterDraft());
}

function beginPlayerTurn(state: GameState, player: Player): void {
  return chain(
    assign(player, {
      hasTradedCurrentTurn: false,
      // Influence skip cards: paralysed players sit out draft AND action phases.
      skippedNow: player.isAlive && player.skipTurns > 0,
    }),
  )
    .thru((player) => tickSkipTurns(state, player))
    .value();
}

function tickSkipTurns(state: GameState, player: Player): void {
  return match(player)
    .when((player) => player.skipTurns <= 0, noop)
    .otherwise((player) =>
      chain(assign(player, { skipTurns: player.skipTurns - 1 }))
        .thru((ticked) => logParalysis(state, ticked))
        .value(),
    );
}

function logParalysis(state: GameState, player: Player): void {
  return match(player)
    .when((player) => !player.isAlive, noop)
    .otherwise(
      (player) =>
        void assign(
          state,
          log(
            state,
            `⏭️ ${player.name} is paralysed and sits this turn out${remainingSkipsSuffix(player.skipTurns)}`,
            'sys',
          ),
        ),
    );
}

function remainingSkipsSuffix(skipTurns: number): string {
  return match(skipTurns)
    .when(
      (count) => count > 0,
      (count) => ` (${count} more)`,
    )
    .otherwise(() => '');
}

function announceSingularity(state: GameState): void {
  return match(!getSingularityAnnounced() && isSingularityInPlay(state))
    .with(
      true,
      () =>
        void assign(
          state,
          log(
            assign(state, { singularityAnnounced: true }),
            '🌀 A Research Lab stands complete somewhere — the SINGULARITY card (technology + extra draft picks) can now appear in the pool!',
            'sys',
          ),
        ),
    )
    .otherwise(noop);
}

function turnFlavor(turn: number): string {
  return match(turn)
    .when(
      (total) => total >= ACTION_CARDS_FROM_TURN,
      () => ' · 🃏 5 buildings · 5 resources · 6 actions',
    )
    .when(
      (total) => total >= BUILDINGS_FROM_TURN,
      () => ' · 🃏 5 buildings · 11 resources',
    )
    .otherwise(() => '');
}

function milestoneLogs(state: GameState): GameState {
  return chain(state)
    .thru((state) =>
      logWhenTurnIs(
        state,
        BUILDINGS_FROM_TURN,
        '🏗️ Building cards have entered the pool — pick one to construct it on the drafting planet!',
      ),
    )
    .thru((state) =>
      logWhenTurnIs(
        state,
        ACTION_CARDS_FROM_TURN,
        '⚡ Action cards have entered the pool — ⚔️ Attack, 🪖 Recruit and 🔁 Trade can now be drafted!',
      ),
    )
    .thru((state) =>
      logWhenTurnIs(
        state,
        MOVE_CARDS_FROM_TURN,
        '🛸 Move cards have entered the pool — troops can now be redeployed (Spaceport required)!',
      ),
    )
    .thru((state) =>
      logWhenTurnIs(
        state,
        ADVANCED_FROM_TURN,
        '🔬 Advanced blueprints unlocked — the 🔬 Research Lab can now appear in the pool!',
      ),
    )
    .value();
}

function logWhenTurnIs(state: GameState, turn: number, msg: string): GameState {
  return match(state.turn)
    .with(turn, () => log(state, msg, 'sys'))
    .otherwise(() => state);
}

// The pick mutations replaced the state object during the draft — re-read it.
async function afterDraft(): Promise<void> {
  return match(getGameState())
    .when(
      () => Boolean(getOver()),
      async (): Promise<void> => undefined,
    )
    .when(
      // Nobody can hold an action card before they exist, so skip the action phase.
      (state) => state.turn < ACTION_CARDS_FROM_TURN,
      async (state): Promise<void> =>
        void assign(
          state,
          log(
            state,
            `🛰️ Fleets hold position — action cards reach the sector on turn ${ACTION_CARDS_FROM_TURN}.`,
            'sys',
          ),
        ),
    )
    .otherwise(() => runActionPhase());
}
