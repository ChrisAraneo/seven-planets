import './assets/game.css';

import { createApp, watch } from 'vue';

import App from './App.vue';
import { installEffects, playNewEffects } from '@seven-planets/effects';
import { getGameState } from '@seven-planets/game';
import { pinia, useEffectsStore } from './stores';

// Composition root: hook the graphical effects into the app, with the
// effects store as the animation sink. Importing ./stores above already
// wired the game state accessor and seated the AI.
const effectsStore = useEffectsStore();
installEffects({
  enqueue: (anim) => effectsStore.anims.push(anim),
  isFastMode: () => effectsStore.fastMode,
});

// Animations fire in RESPONSE to game-state changes: the game core appends
// effect events as it mutates state; this watcher plays the new ones.
watch(
  () => getGameState().effectSeq,
  () => playNewEffects(getGameState()),
);

const app = createApp(App);

app.use(pinia);

app.mount('#app');
