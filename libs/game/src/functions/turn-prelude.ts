import { assign, noop } from 'lodash-es';
import { chain } from '../utils/chain';
import { match } from 'ts-pattern';

import {
  ACTION_CARDS_FROM_TURN,
  ADVANCED_FROM_TURN,
  BUILDINGS_FROM_TURN,
  choice,
  MOVE_CARDS_FROM_TURN,
} from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { doIncome } from './do-income';
import { draftOrder } from './draft-order';
import { filterAlivePlayers } from './filter-alive-players';
import { isSingularityInPlay } from './is-singularity-in-play';
import { log } from './log';
import { makePool } from './make-pool';
import { updatePacifistStatus } from './update-pacifist-status';

/* Everything that happens between turns: bump the turn counter, reset the
   per-turn player flags, promote pacifists, pay income, refill the pool and
   announce the turn. Mutates the reducer's private clone in place — the
   caller (advance) emits it once the game next parks. */
export function turnPrelude(state: GameState): void {
  assign(state, { turn: state.turn + 1 });
  state.players.forEach((player) => beginPlayerTurn(state, player));
  assign(state, updatePacifistStatus(state));
  assign(state, doIncome(state));
  announceSingularity(state);
  assign(state, {
    pool: makePool(state),
    startIdx: choice(filterAlivePlayers(state)).id,
  });
  assign(
    state,
    log(
      state,
      `— TURN ${state.turn} — ${draftOrder(state)[0].name} drafts first${turnFlavor(state.turn)}`,
      'sys',
    ),
  );
  assign(state, milestoneLogs(state));
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
  return match(!state.singularityAnnounced && isSingularityInPlay(state))
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
