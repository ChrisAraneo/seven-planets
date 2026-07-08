import {
  ACTION_CARDS_FROM_TURN,
  ADVANCED_FROM_TURN,
  BUILDINGS_FROM_TURN,
  choice,
  INFLUENCE_CARDS_FROM_TURN,
  MOVE_CARDS_FROM_TURN,
} from '@/game/constants';
import type { GameState } from '@/game/types';
import { alivePlayers } from './alive-players';
import { doIncome } from './do-income';
import { draftOrder } from './draft-order';
import { isSingularityInPlay } from './is-singularity-in-play';
import { log } from './log';
import { makePool } from './make-pool';
import { runActionPhase } from './run-action-phase';
import { runDraft } from './run-draft';
import { updatePacifistStatus } from './update-pacifist-status';

export async function playTurn(state: GameState): Promise<void> {
  state.turn++;
  for (const p of state.players) {
    p.tradedThisTurn = false;
    // Influence skip cards: paralysed players sit out draft AND action phases.
    p.skippedNow = p.alive && p.skipTurns > 0;
    if (p.skipTurns > 0) {
      p.skipTurns--;
      if (p.alive) {
        log(
          state,
          `⏭️ ${p.name} is paralysed and sits this turn out${p.skipTurns > 0 ? ` (${p.skipTurns} more)` : ''}`,
          'sys',
        );
      }
    }
  }
  updatePacifistStatus(state);
  doIncome(state);
  if (!state.singularityAnnounced && isSingularityInPlay(state)) {
    state.singularityAnnounced = true;
    log(
      state,
      '🌀 A Research Lab stands complete somewhere — the SINGULARITY card (technology + extra draft picks) can now appear in the pool!',
      'sys',
    );
  }
  state.pool = makePool(state);
  const alive = alivePlayers(state);
  const starter = choice(alive);
  state.startIdx = starter.id;
  const first = draftOrder(state)[0];
  const flavor =
    state.turn >= ACTION_CARDS_FROM_TURN
      ? ' · 🃏 5 buildings · 5 resources · 6 actions'
      : state.turn >= BUILDINGS_FROM_TURN
        ? ' · 🃏 5 buildings · 11 resources'
        : '';
  log(
    state,
    `— TURN ${state.turn} — ${first.name} drafts first${flavor}`,
    'sys',
  );
  if (state.turn === BUILDINGS_FROM_TURN) {
    log(
      state,
      '🏗️ Building cards have entered the pool — pick one to construct it on the drafting planet!',
      'sys',
    );
  }
  if (state.turn === ACTION_CARDS_FROM_TURN) {
    log(
      state,
      '⚡ Action cards have entered the pool — ⚔️ Attack, 🪖 Recruit and 🔁 Trade can now be drafted!',
      'sys',
    );
  }
  if (state.turn === MOVE_CARDS_FROM_TURN) {
    log(
      state,
      '🛸 Move cards have entered the pool — troops can now be redeployed (Spaceport required)!',
      'sys',
    );
  }
  if (state.turn === ADVANCED_FROM_TURN) {
    log(
      state,
      '🔬 Advanced blueprints unlocked — the 🔬 Research Lab can now appear in the pool!',
      'sys',
    );
  }

  await runDraft(state);
  if (state.over) {
    return;
  }
  // Nobody can hold an action card before they exist, so skip the action phase.
  if (state.turn < ACTION_CARDS_FROM_TURN) {
    log(
      state,
      `🛰️ Fleets hold position — action cards reach the sector on turn ${ACTION_CARDS_FROM_TURN}.`,
      'sys',
    );
    return;
  }
  await runActionPhase(state);
}
