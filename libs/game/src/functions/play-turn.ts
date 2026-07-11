import { getOver } from '../getters/get-over';
import { getSingularityAnnounced } from '../getters/get-singularity-announced';
import { getTurn } from '../getters/get-turn';
import {
  ACTION_CARDS_FROM_TURN,
  ADVANCED_FROM_TURN,
  BUILDINGS_FROM_TURN,
  choice,
  INFLUENCE_CARDS_FROM_TURN,
  MOVE_CARDS_FROM_TURN,
} from '../config/constants';
import { getGameState } from '../game-state';

import { filterAlivePlayers } from './filter-alive-players';
import { doIncome } from './do-income';
import { draftOrder } from './draft-order';
import { isSingularityInPlay } from './is-singularity-in-play';
import { log } from './log';
import { makePool } from './make-pool';
import { runActionPhase } from '../functions/run-action-phase';
import { runDraft } from '../functions/run-draft';
import { updatePacifistStatus } from './update-pacifist-status';

export async function playTurn(): Promise<void> {
  // The prelude is synchronous — no store mutation reassigns the state
  // object here — so one reference is safe until the first `await`.
  const state = getGameState();
  state.turn++;
  for (const p of state.players) {
    p.tradedThisTurn = false;
    // Influence skip cards: paralysed players sit out draft AND action phases.
    p.skippedNow = p.alive && p.skipTurns > 0;
    if (p.skipTurns > 0) {
      p.skipTurns--;
      if (p.alive) {
        Object.assign(
          state,
          log(
            state,
            `⏭️ ${p.name} is paralysed and sits this turn out${p.skipTurns > 0 ? ` (${p.skipTurns} more)` : ''}`,
            'sys',
          ),
        );
      }
    }
  }
  Object.assign(state, updatePacifistStatus(state));
  Object.assign(state, doIncome(state));
  if (!getSingularityAnnounced() && isSingularityInPlay(state)) {
    state.singularityAnnounced = true;
    Object.assign(
      state,
      log(
        state,
        '🌀 A Research Lab stands complete somewhere — the SINGULARITY card (technology + extra draft picks) can now appear in the pool!',
        'sys',
      ),
    );
  }
  state.pool = makePool(state);
  const alive = filterAlivePlayers(state);
  const starter = choice(alive);
  state.startIdx = starter.id;
  const first = draftOrder(state)[0];
  const flavor =
    getTurn() >= ACTION_CARDS_FROM_TURN
      ? ' · 🃏 5 buildings · 5 resources · 6 actions'
      : getTurn() >= BUILDINGS_FROM_TURN
        ? ' · 🃏 5 buildings · 11 resources'
        : '';
  Object.assign(
    state,
    log(
      state,
      `— TURN ${getTurn()} — ${first.name} drafts first${flavor}`,
      'sys',
    ),
  );
  if (getTurn() === BUILDINGS_FROM_TURN) {
    Object.assign(
      state,
      log(
        state,
        '🏗️ Building cards have entered the pool — pick one to construct it on the drafting planet!',
        'sys',
      ),
    );
  }
  if (getTurn() === ACTION_CARDS_FROM_TURN) {
    Object.assign(
      state,
      log(
        state,
        '⚡ Action cards have entered the pool — ⚔️ Attack, 🪖 Recruit and 🔁 Trade can now be drafted!',
        'sys',
      ),
    );
  }
  if (getTurn() === MOVE_CARDS_FROM_TURN) {
    Object.assign(
      state,
      log(
        state,
        '🛸 Move cards have entered the pool — troops can now be redeployed (Spaceport required)!',
        'sys',
      ),
    );
  }
  if (getTurn() === ADVANCED_FROM_TURN) {
    Object.assign(
      state,
      log(
        state,
        '🔬 Advanced blueprints unlocked — the 🔬 Research Lab can now appear in the pool!',
        'sys',
      ),
    );
  }

  await runDraft();
  if (getOver()) {
    return;
  }
  // Nobody can hold an action card before they exist, so skip the action phase.
  if (getTurn() < ACTION_CARDS_FROM_TURN) {
    Object.assign(
      getGameState(),
      log(
        getGameState(),
        `🛰️ Fleets hold position — action cards reach the sector on turn ${ACTION_CARDS_FROM_TURN}.`,
        'sys',
      ),
    );
    return;
  }
  await runActionPhase();
}
