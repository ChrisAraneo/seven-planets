import { setAiDifficulty } from '@seven-planets/ai';
import {
  DEFAULT_DIFFICULTY,
  type Difficulty,
  getDifficulty,
} from '@seven-planets/game';
import { assignKamikazes } from '@seven-planets/game';
import { IS_AUTO_HUMAN } from '@seven-planets/game';
import { startGame } from '@seven-planets/game';
import { getGameStateLastValue, setGameState } from '@seven-planets/game';
import { assign, noop } from 'lodash-es';
import { defineStore } from 'pinia';
import { match } from 'ts-pattern';
import { ref } from 'vue';

import { chain } from '@/utils/chain';

import { useEffectsStore } from './effects-store';

export type ModalName =
  | 'help'
  | 'attack'
  | 'recruit'
  | 'move'
  | 'trade'
  | 'influence'
  | null;

const applyDifficulty = (level: Difficulty): void =>
  chain(getDifficulty(level))
    .tap((def) => setAiDifficulty(def.ai))
    .thru((def) =>
      setGameState(assignKamikazes(getGameStateLastValue(), def.kamikazeCount)),
    )
    .thru(noop)
    .value();

const restartGame = (): void =>
  match(typeof window)
    .with('undefined', noop)
    .otherwise(() => window.location.reload());

export const useUiStore = defineStore('ui', () => {
  const modal = ref<ModalName>(null);
  const started = ref(false);
  const difficulty = ref<Difficulty | null>(null);

  const openModal = (name: ModalName): void =>
    chain(assign(modal, { value: name }))
      .thru(noop)
      .value();

  const closeModal = (): void =>
    chain(assign(modal, { value: null }))
      .thru(noop)
      .value();

  const chooseDifficulty = (level: Difficulty): void =>
    match(started.value)
      .with(true, noop)
      .otherwise(() =>
        chain(level)
          .tap(() => assign(difficulty, { value: level }))
          .tap(applyDifficulty)
          .tap(() => assign(started, { value: true }))
          .thru(() => startGame())
          .thru(noop)
          .value(),
      );

  const start = (): void =>
    match(!started.value && IS_AUTO_HUMAN)
      .with(true, () =>
        chain(assign(useEffectsStore(), { fastMode: true }))
          .thru(() => chooseDifficulty(DEFAULT_DIFFICULTY))
          .value(),
      )
      .otherwise(noop);

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
