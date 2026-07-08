import {
  ACTION_CARDS_FROM_TURN,
  ADVANCED_FROM_TURN,
  BUILDINGS_FROM_TURN,
  choice,
  INFLUENCE_CARDS_FROM_TURN,
  MOVE_CARDS_FROM_TURN,
} from '@/game/constants';
import { getGameState } from '@/stores/game-state';

import { alivePlayers } from './alive-players';
import { doIncome } from './do-income';
import { draftOrder } from './draft-order';
import { isSingularityInPlay } from './is-singularity-in-play';
import { log } from './log';
import { makePool } from './make-pool';
import { runActionPhase } from './run-action-phase';
import { runDraft } from './run-draft';
import { updatePacifistStatus } from './update-pacifist-status';

export async function playTurn(): Promise<void> {
  const state = getGameState();
  state.turn++;
  for (const p of state.players) {
    p.tradedThisTurn = false;
    // Influence skip cards: paralysed players sit out draft AND action phases.
    p.skippedNow = p.alive && p.skipTurns > 0;
    if (p.skipTurns > 0) {
      p.skipTurns--;
      if (p.alive) {
        log(
          `⏭️ ${p.name} is paralysed and sits this turn out${p.skipTurns > 0 ? ` (${p.skipTurns} more)` : ''}`,
          'sys',
        );
      }
    }
  }
  updatePacifistStatus();
  doIncome();
  if (!state.singularityAnnounced && isSingularityInPlay()) {
    state.singularityAnnounced = true;
    log(
      '🌀 A Research Lab stands complete somewhere — the SINGULARITY card (technology + extra draft picks) can now appear in the pool!',
      'sys',
    );
  }
  state.pool = makePool();
  const alive = alivePlayers();
  const starter = choice(alive);
  state.startIdx = starter.id;
  const first = draftOrder()[0];
  const flavor =
    state.turn >= ACTION_CARDS_FROM_TURN
      ? ' · 🃏 5 buildings · 5 resources · 6 actions'
      : state.turn >= BUILDINGS_FROM_TURN
        ? ' · 🃏 5 buildings · 11 resources'
        : '';
  log(`— TURN ${state.turn} — ${first.name} drafts first${flavor}`, 'sys');
  if (state.turn === BUILDINGS_FROM_TURN) {
    log(
      '🏗️ Building cards have entered the pool — pick one to construct it on the drafting planet!',
      'sys',
    );
  }
  if (state.turn === ACTION_CARDS_FROM_TURN) {
    log(
      '⚡ Action cards have entered the pool — ⚔️ Attack, 🪖 Recruit and 🔁 Trade can now be drafted!',
      'sys',
    );
  }
  if (state.turn === MOVE_CARDS_FROM_TURN) {
    log(
      '🛸 Move cards have entered the pool — troops can now be redeployed (Spaceport required)!',
      'sys',
    );
  }
  if (state.turn === ADVANCED_FROM_TURN) {
    log(
      '🔬 Advanced blueprints unlocked — the 🔬 Research Lab can now appear in the pool!',
      'sys',
    );
  }

  await runDraft();
  if (state.over) {
    return;
  }
  // Nobody can hold an action card before they exist, so skip the action phase.
  if (state.turn < ACTION_CARDS_FROM_TURN) {
    log(
      `🛰️ Fleets hold position — action cards reach the sector on turn ${ACTION_CARDS_FROM_TURN}.`,
      'sys',
    );
    return;
  }
  await runActionPhase();
}
