<script setup lang="ts">
import { getOver } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { computed } from 'vue';
import { store } from '@/stores';
import ModalShell from './ModalShell.vue';
import { buildingCount } from '@seven-planets/game';
import { totalTroops } from '@seven-planets/game';

const over = computed(() => getOver());
const human = store.state.game.state.players[0];
const humanWon = computed(
  () => !!over.value?.winner && over.value.winner.isHuman,
);

const title = computed(() => {
  if (!over.value) return '';
  if (over.value.reason === 'conquest')
    return humanWon.value ? 'GALACTIC EMPEROR' : 'DEFEAT';
  return 'HOMEWORLD LOST';
});
const sub = computed(() => {
  if (!over.value) return '';
  if (over.value.reason === 'conquest') {
    return humanWon.value
      ? 'All seven planets kneel before Terra Prime.'
      : `${over.value.winner?.name} has conquered the galaxy.`;
  }
  return 'Your last planet has fallen to enemy rockets.';
});
</script>

<template>
  <ModalShell v-if="over">
    <div class="gameover-title" :class="humanWon ? 'win' : 'lose'">
      {{ title }}
    </div>
    <div class="gostats">
      {{ sub }}<br /><br />
      Turns played: {{ getTurn() }} · Planets held: {{ human.planets.length }} ·
      Buildings: {{ buildingCount(store.state.game.state, human) }} · Troops:
      {{ totalTroops(store.state.game.state, human) }}
    </div>
    <div class="mbtns" style="justify-content: center">
      <button class="btn" @click="store.dispatch('ui/newGame')">
        🔄 Play Again
      </button>
    </div>
  </ModalShell>
</template>
