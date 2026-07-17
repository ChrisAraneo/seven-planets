import './assets/game.css';

import { installEffects, playNewEffects } from '@seven-planets/effects';
import { getGameState } from '@seven-planets/game';
import { distinctUntilKeyChanged } from 'rxjs';
import { createApp } from 'vue';

import App from './App.vue';
import { vTooltip } from './directives/tooltip';
import { pinia, useEffectsStore } from './stores';

const effectsStore = useEffectsStore();
installEffects({
  enqueue: (anim) => effectsStore.anims.push(anim),
  isFastMode: () => effectsStore.fastMode,
});

getGameState()
  .pipe(distinctUntilKeyChanged('effectSeq'))
  .subscribe((snapshot) => playNewEffects(snapshot));

const app = createApp(App);

app.use(pinia);
app.directive('tooltip', vTooltip);

app.mount('#app');
