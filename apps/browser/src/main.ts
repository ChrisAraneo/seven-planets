import './assets/game.css';

import { createApp } from 'vue';

import App from './App.vue';
import { installEffects } from '@seven-planets/effects';
import { pinia, useEffectsStore } from './stores';

// Composition root: hook the graphical effects into the game core's
// presentation bridge, with the effects store as the animation sink.
// Importing ./stores above already wired the game state accessor and
// seated the AI — nothing else to install here.
const effectsStore = useEffectsStore();
installEffects({
  enqueue: (anim) => effectsStore.anims.push(anim),
  isFastMode: () => effectsStore.fastMode,
});

const app = createApp(App);

app.use(pinia);

app.mount('#app');
