import { installAi } from '@seven-planets/ai';
import { getGameState } from '@seven-planets/game';
import { createPinia, setActivePinia } from 'pinia';
import { distinctUntilChanged, map } from 'rxjs';

import { useUiStore } from './ui-store';
import { useUnlocksStore } from './unlocks-store';

export const pinia = createPinia();
setActivePinia(pinia);

export { useEffectsStore } from './effects-store';
export { useGameStore } from './game-store';
export { type ModalName, useUiStore } from './ui-store';
export { useUnlocksStore } from './unlocks-store';

installAi();

getGameState()
  .pipe(
    map((snapshot) => snapshot.over),
    distinctUntilChanged(),
  )
  .subscribe((over) => {
    const level = useUiStore().difficulty;
    if (over?.winner?.isHuman && level) {
      useUnlocksStore().recordWin(level);
    }
  });
