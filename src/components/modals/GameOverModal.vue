<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/game';
import ModalShell from './ModalShell.vue';
import { buildingCount } from '@/game/engine/functions/building-count';
import { totalTroops } from '@/game/engine/functions/total-troops';

const store = useGameStore();
const state = store.state;
const over = computed(() => store.state.over);
const human = store.human;
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
      Turns played: {{ store.state.turn }} · Planets held:
      {{ human.planets.length }} · Buildings: {{ buildingCount(human) }} ·
      Troops:
      {{ totalTroops(human) }}
    </div>
    <div class="mbtns" style="justify-content: center">
      <button class="btn" @click="store.newGame()">🔄 Play Again</button>
    </div>
  </ModalShell>
</template>
