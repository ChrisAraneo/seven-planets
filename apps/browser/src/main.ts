import './assets/game.css';

import { createApp } from 'vue';
import { distinctUntilKeyChanged } from 'rxjs';

import App from './App.vue';
import { installEffects, playNewEffects } from '@seven-planets/effects';
import { getGameState } from '@seven-planets/game';
import { pinia, useEffectsStore } from './stores';

// Composition root: hook the graphical effects into the app, with the
// effects store as the animation sink. Importing ./stores above already
// seated the AI's subscriptions.
const effectsStore = useEffectsStore();
installEffects({
  enqueue: (anim) => effectsStore.anims.push(anim),
  isFastMode: () => effectsStore.fastMode,
});

// Animations fire in RESPONSE to game-state emissions: the game core
// appends effect events as it mutates state and publishes snapshots;
// this subscription plays the new ones.
getGameState()
  .pipe(distinctUntilKeyChanged('effectSeq'))
  .subscribe((snapshot) => playNewEffects(snapshot));

const app = createApp(App);

app.use(pinia);

app.mount('#app');
