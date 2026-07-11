import { chain, noop } from 'lodash-es';
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
    .tap((state) => Object.assign(state, { turn: state.turn + 1 }))
    .tap((state) => state.players.forEach((p) => beginPlayerTurn(state, p)))
    .tap((state) => Object.assign(state, updatePacifistStatus(state, hooks)))
    .tap((state) => Object.assign(state, doIncome(state)))
    .tap((state) => announceSingularity(state))
    .tap((state) =>
      Object.assign(state, {
        pool: makePool(state),
        startIdx: choice(filterAlivePlayers(state)).id,
      }),
    )
    .tap((state) =>
      Object.assign(
        state,
        log(
          state,
          `— TURN ${state.turn} — ${draftOrder(state)[0].name} drafts first${turnFlavor(state.turn)}`,
          'sys',
        ),
      ),
    )
    .tap((state) => Object.assign(state, milestoneLogs(state)))
    .thru(() => runDraft(hooks))
    .value()
    .then(() => afterDraft());
}

function beginPlayerTurn(state: GameState, p: Player): void {
  return chain(
    Object.assign(p, {
      hasTradedCurrentTurn: false,
      // Influence skip cards: paralysed players sit out draft AND action phases.
      skippedNow: p.isAlive && p.skipTurns > 0,
    }),
  )
    .thru((pl) => tickSkipTurns(state, pl))
    .value();
}

function tickSkipTurns(state: GameState, p: Player): void {
  return match(p)
    .when((pl) => pl.skipTurns <= 0, noop)
    .otherwise((pl) =>
      chain(Object.assign(pl, { skipTurns: pl.skipTurns - 1 }))
        .thru((ticked) => logParalysis(state, ticked))
        .value(),
    );
}

function logParalysis(state: GameState, p: Player): void {
  return match(p)
    .when((pl) => !pl.isAlive, noop)
    .otherwise(
      (pl) =>
        void Object.assign(
          state,
          log(
            state,
            `⏭️ ${pl.name} is paralysed and sits this turn out${remainingSkipsSuffix(pl.skipTurns)}`,
            'sys',
          ),
        ),
    );
}

function remainingSkipsSuffix(skipTurns: number): string {
  return match(skipTurns)
    .when(
      (n) => n > 0,
      (n) => ` (${n} more)`,
    )
    .otherwise(() => '');
}

function announceSingularity(state: GameState): void {
  return match(!getSingularityAnnounced() && isSingularityInPlay(state))
    .with(
      true,
      () =>
        void Object.assign(
          state,
          log(
            Object.assign(state, { singularityAnnounced: true }),
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
      (t) => t >= ACTION_CARDS_FROM_TURN,
      () => ' · 🃏 5 buildings · 5 resources · 6 actions',
    )
    .when(
      (t) => t >= BUILDINGS_FROM_TURN,
      () => ' · 🃏 5 buildings · 11 resources',
    )
    .otherwise(() => '');
}

function milestoneLogs(state: GameState): GameState {
  return chain(state)
    .thru((s) =>
      logWhenTurnIs(
        s,
        BUILDINGS_FROM_TURN,
        '🏗️ Building cards have entered the pool — pick one to construct it on the drafting planet!',
      ),
    )
    .thru((s) =>
      logWhenTurnIs(
        s,
        ACTION_CARDS_FROM_TURN,
        '⚡ Action cards have entered the pool — ⚔️ Attack, 🪖 Recruit and 🔁 Trade can now be drafted!',
      ),
    )
    .thru((s) =>
      logWhenTurnIs(
        s,
        MOVE_CARDS_FROM_TURN,
        '🛸 Move cards have entered the pool — troops can now be redeployed (Spaceport required)!',
      ),
    )
    .thru((s) =>
      logWhenTurnIs(
        s,
        ADVANCED_FROM_TURN,
        '🔬 Advanced blueprints unlocked — the 🔬 Research Lab can now appear in the pool!',
      ),
    )
    .value();
}

function logWhenTurnIs(s: GameState, turn: number, msg: string): GameState {
  return match(s.turn)
    .with(turn, () => log(s, msg, 'sys'))
    .otherwise(() => s);
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
      (s) => s.turn < ACTION_CARDS_FROM_TURN,
      async (s): Promise<void> =>
        void Object.assign(
          s,
          log(
            s,
            `🛰️ Fleets hold position — action cards reach the sector on turn ${ACTION_CARDS_FROM_TURN}.`,
            'sys',
          ),
        ),
    )
    .otherwise(() => runActionPhase());
}
