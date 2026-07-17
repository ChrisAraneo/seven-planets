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
  const difficulty = ref<Difficulty | null>(null);

  const openModal = (name: ModalName): void => {
    modal.value = name;
  };

  const closeModal = (): void => {
    modal.value = null;
  };

  const chooseDifficulty = (level: Difficulty): void => {
    if (started.value) {
      return;
    }
    difficulty.value = level;
    applyDifficulty(level);
    started.value = true;
    runGame();
  };

  const start = (): void => {
    if (!started.value && IS_AUTO_HUMAN) {
      useEffectsStore().fastMode = true;
      chooseDifficulty(DEFAULT_DIFFICULTY);
    }
  };

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

const applyDifficulty = (level: Difficulty): void => {
  const def = getDifficulty(level);
  setAiDifficulty(def.ai);
  setGameState(assignKamikazes(getGameStateLastValue(), def.kamikazeCount));
};

const restartGame = (): void => {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};
