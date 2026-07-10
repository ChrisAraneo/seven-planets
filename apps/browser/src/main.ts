import './assets/game.css';

import { createApp } from 'vue';

import App from './App.vue';
import { installEffects } from '@seven-planets/effects';
import { store } from './stores';

// Composition root: hook the graphical effects into the game core's
// presentation bridge. The AI is wired as a store plugin (@/ai/ai-module),
// so creating the store above already seats it — nothing to install here.
installEffects();

const app = createApp(App);

app.use(store);

app.mount('#app');
