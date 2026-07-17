import { assign, noop } from 'lodash-es';
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
import { chain } from '../utils/chain';
import { createPool } from './create-pool';
import { doIncome } from './do-income';
import { doShieldUpkeep } from './do-shield-upkeep';
import { filterAlivePlayers } from './filter-alive-players';
import { getDraftOrder } from './get-draft-order';
import { isSingularityInPlay } from './is-singularity-in-play';
import { log } from './log';
import { updatePacifistStatus } from './update-pacifist-status';

export function turnPrelude(state: GameState): void {
  assign(state, { turn: state.turn + 1 });
  state.players.forEach((player) => beginPlayerTurn(state, player));
  assign(state, updatePacifistStatus(state));
  assign(state, doIncome(state));
  assign(state, doShieldUpkeep(state));
  announceSingularity(state);
  assign(state, {
    pool: createPool(state),
    startIdx: choice(filterAlivePlayers(state)).id,
  });
  assign(
    state,
    log(
      state,
      `— TURN ${state.turn} — ${getDraftOrder(state)[0].name} drafts first${getTurnFlavor(state.turn)}`,
      'sys',
    ),
  );
  assign(state, getMilestoneLogs(state));
}

function beginPlayerTurn(state: GameState, player: Player): void {
  return chain(
    assign(player, {
      hasTradedCurrentTurn: false,
      isSkippedNow: player.isAlive && player.skipTurns > 0,
    }),
  )
    .thru(() => tickSkipTurns(state, player))
    .value();
}

function tickSkipTurns(state: GameState, player: Player): void {
  return match(player)
    .when(() => player.skipTurns <= 0, noop)
    .otherwise(() =>
      chain(assign(player, { skipTurns: player.skipTurns - 1 }))
        .thru((ticked) => logParalysis(state, ticked))
        .value(),
    );
}

function logParalysis(state: GameState, player: Player): void {
  return match(player)
    .when(() => !player.isAlive, noop)
    .otherwise(
      () =>
        void assign(
          state,
          log(
            state,
            `⏭️ ${player.name} is paralysed and sits this turn out${getRemainingSkipsSuffix(player.skipTurns)}`,
            'sys',
          ),
        ),
    );
}

function getRemainingSkipsSuffix(skipTurns: number): string {
  return match(skipTurns)
    .when(
      (count) => count > 0,
      (count) => ` (${count} more)`,
    )
    .otherwise(() => '');
}

function announceSingularity(state: GameState): void {
  return match(!state.isSingularityAnnounced && isSingularityInPlay(state))
    .with(
      true,
      () =>
        void assign(
          state,
          log(
            assign(state, { isSingularityAnnounced: true }),
            '🌀 A Research Lab stands complete somewhere — the SINGULARITY card (technology + extra draft picks) can now appear in the pool!',
            'sys',
          ),
        ),
    )
    .otherwise(noop);
}

function getTurnFlavor(turn: number): string {
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

function getMilestoneLogs(state: GameState): GameState {
  return chain(state)
    .thru((current) =>
      logWhenTurnIs(
        current,
        BUILDINGS_FROM_TURN,
        '🏗️ Building cards have entered the pool — pick one to construct it on the drafting planet!',
      ),
    )
    .thru((current) =>
      logWhenTurnIs(
        current,
        ACTION_CARDS_FROM_TURN,
        '⚡ Action cards have entered the pool — ⚔️ Attack, 🪖 Recruit and 🔁 Trade can now be drafted!',
      ),
    )
    .thru((current) =>
      logWhenTurnIs(
        current,
        MOVE_CARDS_FROM_TURN,
        '🛸 Move cards have entered the pool — troops can now be redeployed (Spaceport required)!',
      ),
    )
    .thru((current) =>
      logWhenTurnIs(
        current,
        ADVANCED_FROM_TURN,
        '🔬 Advanced blueprints unlocked — the 🔬 Research Lab can now appear in the pool!',
      ),
    )
    .value();
}

function logWhenTurnIs(
  state: GameState,
  turn: number,
  message: string,
): GameState {
  return match(state.turn)
    .with(turn, () => log(state, message, 'sys'))
    .otherwise(() => state);
}
