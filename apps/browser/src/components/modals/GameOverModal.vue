<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore, useUiStore } from '@/stores';
import ModalShell from './ModalShell.vue';
import { getBuildingCount } from '@seven-planets/game';
import { computeTotalTroops } from '@seven-planets/game';
import { match } from 'ts-pattern';
import { nullish } from '@/utils/p';

const game = useGameStore();
const ui = useUiStore();

const over = computed(() => game.state.over);
const human = game.state.players[0];
const humanWon = computed(
  () => Boolean(over.value?.winner) && Boolean(over.value?.winner?.isHuman),
);

const title = computed(() =>
  match(over.value)
    .with(nullish, () => '')
    .with({ reason: 'CONQUEST' }, () =>
      match(humanWon.value)
        .with(true, () => 'GALACTIC EMPEROR')
        .otherwise(() => 'DEFEAT'),
    )
    .otherwise(() => 'HOMEWORLD LOST'),
);
const resultClass = computed(() =>
  match(humanWon.value)
    .with(true, () => 'win')
    .otherwise(() => 'lose'),
);
const sub = computed(() =>
  match(over.value)
    .with(nullish, () => '')
    .with({ reason: 'CONQUEST' }, (gameOver) =>
      match(humanWon.value)
        .with(true, () => 'All seven planets kneel before Terra Prime.')
        .otherwise(() => `${gameOver.winner?.name} has conquered the galaxy.`),
    )
    .otherwise(() => 'Your last planet has fallen to enemy rockets.'),
);
</script>

<template>
  <ModalShell v-if="over">
    <div class="gameover-title" :class="resultClass">
      {{ title }}
    </div>
    <div class="gostats">
      {{ sub }}<br /><br />
      Turns played: {{ game.state.turn }} · Planets held:
      {{ game.state.planets.filter((pl) => pl.ownerId === human.id).length }} ·
      Buildings: {{ getBuildingCount(game.state, human) }} · Troops:
      {{ computeTotalTroops(game.state, human) }}
    </div>
    <div class="mbtns" style="justify-content: center">
      <button class="btn" @click="ui.restartGame()">🔄 Play Again</button>
    </div>
  </ModalShell>
</template>
