<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { moveTroops } from '@seven-planets/game';
import { useGameStore, useUiStore } from '@/stores';
import ModalShell from './ModalShell.vue';
import { getOwnedPlanets } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';

const game = useGameStore();
const ui = useUiStore();

const human = game.state.players[0];

// Troops launch only FROM a Spaceport planet — those are the valid origins.
const sources = computed(() =>
  getOwnedPlanets(game.state, human).filter(
    (planet) => planet.buildings.SPACEPORT,
  ),
);

const fromId = ref(
  (sources.value.length
    ? sources.value
    : getOwnedPlanets(game.state, human)
  ).reduce((strongest, planet) =>
    strongest.troops >= planet.troops ? strongest : planet,
  ).id,
);
const toId = ref(-1);
const troopCount = ref(1);

const from = computed(() => game.state.planets[fromId.value]);
const owned = computed(() => getOwnedPlanets(game.state, human));
const dests = computed(() =>
  owned.value.filter((planet) => planet.id !== fromId.value),
);
const capacity = computed(() =>
  Math.min(getRocketCapacity(from.value), from.value.troops),
);

watch(
  [dests, fromId],
  () => {
    if (!dests.value.some((planet) => planet.id === toId.value))
      toId.value = dests.value.length ? dests.value[0].id : -1;
    troopCount.value = Math.max(
      1,
      Math.min(troopCount.value, Math.max(1, capacity.value)),
    );
  },
  { immediate: true },
);

const capacityLabel = computed(() =>
  getRocketCapacity(from.value) === Infinity
    ? '∞ (all troops)'
    : String(getRocketCapacity(from.value)),
);

function decrease(): void {
  if (troopCount.value > 1) troopCount.value--;
}
function increase(): void {
  if (troopCount.value < capacity.value) troopCount.value++;
}
function doMove(): void {
  if (capacity.value < 1 || toId.value < 0) return;
  ui.closeModal();
  void moveTroops({
    playerId: 0,
    fromId: fromId.value,
    toId: toId.value,
    troops: troopCount.value,
  });
}
</script>

<template>
  <ModalShell @close="ui.closeModal()">
    <h2>🛸 REDEPLOY TROOPS</h2>
    <p class="dimtx">
      Move an army between your planets. Uses the origin's rockets (capacity
      {{ capacityLabel }}). Spends one 🛸 Move card (you have
      {{ human.hand.MOVE }}).
    </p>
    <p>
      From (🛰️ Spaceport planets only):
      <button
        v-for="planet in sources"
        :key="planet.id"
        class="tab"
        :class="{ active: planet.id === fromId }"
        @click="fromId = planet.id">
        {{ planet.name }} 🪖{{ planet.troops }}
      </button>
    </p>
    <div
      v-for="planet in dests"
      :key="planet.id"
      class="trow"
      :class="{ sel: planet.id === toId }"
      @click="toId = planet.id">
      <div class="tinfo">
        <b>{{ planet.name }}</b>
      </div>
      <div>🪖{{ planet.troops }}</div>
    </div>
    <p style="margin-top: 12px">
      Troops aboard:
      <span class="stepper">
        <button @click="decrease">−</button
        ><span class="sval">{{ troopCount }}</span
        ><button @click="increase">+</button>
      </span>
      <span class="dimtx">({{ from.name }} garrisons {{ from.troops }})</span>
    </p>
    <div class="mbtns">
      <button class="btn" :disabled="capacity < 1" @click="doMove">
        🛸 MOVE
      </button>
      <button class="btn" @click="ui.closeModal()">Cancel</button>
    </div>
  </ModalShell>
</template>
