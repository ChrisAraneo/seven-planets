import { setAiDifficulty } from '@seven-planets/ai';
import {
  DEFAULT_DIFFICULTY,
  type Difficulty,
  getDifficulty,
} from '@seven-planets/game';
import { assignKamikazes } from '@seven-planets/game';
import { IS_AUTO_HUMAN } from '@seven-planets/game';
import { runGame } from '@seven-planets/game';
import { getGameStateLastValue, setGameState } from '@seven-planets/game';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { useEffectsStore } from './effects-store';

/* =====================================================================
   UI orchestration state: which modal is open, the chosen difficulty
   and the game lifecycle (start / new game). Pure presentation-side
   state — the game core never reads it.
   ===================================================================== */

export type ModalName =
  | 'help'
  | 'attack'
  | 'recruit'
  | 'move'
  | 'trade'
  | 'influence'
  | null;

export const useUiStore = defineStore('ui', () => {
  const modal = ref<ModalName>(null);
  const started = ref(false);
  /** The human's chosen difficulty. Null until picked — the game loop waits
      for the choice (see start / chooseDifficulty). */
  const difficulty = ref<Difficulty | null>(null);

  function openModal(name: ModalName): void {
    modal.value = name;
  }

  function closeModal(): void {
    modal.value = null;
  }

  /** The human picked a difficulty on the opening screen — boot the game loop.
      (Every level is currently identical; the choice is stored for later use.) */
  function chooseDifficulty(level: Difficulty): void {
    if (started.value) {
      return;
    }
    difficulty.value = level;
    applyDifficulty(level);
    started.value = true;
    runGame();
  }

  /** Called from the root component on mount. In demo mode ("?auto"/headless)
      the game starts immediately; otherwise it waits for the human to pick a
      difficulty via the opening DifficultyModal (see chooseDifficulty). */
  function start(): void {
    // Demo mode ("?auto") runs at full tilt with no difficulty prompt.
    if (!started.value && IS_AUTO_HUMAN) {
      useEffectsStore().fastMode = true;
      chooseDifficulty(DEFAULT_DIFFICULTY);
    }
  }

  return {
    modal,
    started,
    difficulty,
    openModal,
    closeModal,
    start,
    chooseDifficulty,
    restartGame,
  };
});

// Apply this level's handicap to every mastermind AI before the loop runs,
// Then assign its kamikazes (Hard mode: 2 AI that hunt only the human).
function applyDifficulty(level: Difficulty): void {
  const def = getDifficulty(level);
  setAiDifficulty(def.ai);
  setGameState(assignKamikazes(getGameStateLastValue(), def.kamikazeCount));
}

function restartGame(): void {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}
