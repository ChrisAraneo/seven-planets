import './assets/game.css';

import { installEffects, playNewEffects } from '@seven-planets/effects';
import { getGameState } from '@seven-planets/game';
import { distinctUntilKeyChanged } from 'rxjs';
import { createApp } from 'vue';

import App from './App.vue';
import { V_TOOLTIP } from './directives/tooltip';
import { PINIA, useEffectsStore } from './stores';

const EFFECTS_STORE = useEffectsStore();
installEffects({
  enqueue: (anim) => EFFECTS_STORE.anims.push(anim),
  isFastMode: () => EFFECTS_STORE.isFastMode,
});

getGameState()
  .pipe(distinctUntilKeyChanged('effectSeq'))
  .subscribe((snapshot) => playNewEffects(snapshot));

const APP = createApp(App);

APP.use(PINIA);
APP.directive('tooltip', V_TOOLTIP);

APP.mount('#app');
