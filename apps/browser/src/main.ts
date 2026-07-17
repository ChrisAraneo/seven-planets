import './assets/game.css';

import { installEffects, playNewEffects } from '@seven-planets/effects';
import { getGameState } from '@seven-planets/game';
import { distinctUntilKeyChanged } from 'rxjs';
import { createApp } from 'vue';

import App from './App.vue';
import { vTooltip } from './directives/tooltip';
import { pinia, useEffectsStore } from './stores';

// Composition root: hook the graphical effects into the app, with the
// Effects store as the animation sink. Importing ./stores above already
// Seated the AI's subscriptions.
const effectsStore = useEffectsStore();
installEffects({
  enqueue: (anim) => effectsStore.anims.push(anim),
  isFastMode: () => effectsStore.fastMode,
});

// Animations fire in RESPONSE to game-state emissions: the game core
// Appends effect events as it mutates state and publishes snapshots;
// This subscription plays the new ones.
getGameState()
  .pipe(distinctUntilKeyChanged('effectSeq'))
  .subscribe((snapshot) => playNewEffects(snapshot));

const app = createApp(App);

app.use(pinia);
// Floating-ui tooltips: v-tooltip="text" replaces the native title attribute.
app.directive('tooltip', vTooltip);

app.mount('#app');
