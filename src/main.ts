import './assets/game.css';

import { createApp } from 'vue';

import { installAi } from './ai/agent';
import App from './App.vue';
import { installEffects } from './effects/effects';
import { store } from './stores';

// Composition root: hook the graphical effects into the game core's
// Presentation bridge and seat the AI agent at the engine's table.
installEffects();
installAi();

const app = createApp(App);

app.use(store);

app.mount('#app');
