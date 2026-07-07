<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useGameStore } from '@/stores/game';
import ModalShell from './ModalShell.vue';
import { ownedPlanets, rocketCap } from '@/game/engine/index.ts';

const store = useGameStore();
const human = store.human;

const fromId = ref(
  ownedPlanets(human).reduce((a, b) => (a.troops >= b.troops ? a : b)).id,
);
const toId = ref(-1);
const n = ref(1);

const from = computed(() => store.state.planets[fromId.value]);
const owned = computed(() => ownedPlanets(human));
const dests = computed(() =>
  owned.value.filter((pl) => pl.id !== fromId.value),
);
const cap = computed(() => Math.min(rocketCap(from.value), from.value.troops));

watch(
  [dests, fromId],
  () => {
    if (!dests.value.some((pl) => pl.id === toId.value))
      toId.value = dests.value.length ? dests.value[0].id : -1;
    n.value = Math.max(1, Math.min(n.value, Math.max(1, cap.value)));
  },
  { immediate: true },
);

const capFmt = computed(() =>
  rocketCap(from.value) === Infinity
    ? '∞ (all troops)'
    : String(rocketCap(from.value)),
);

function dec(): void {
  if (n.value > 1) n.value--;
}
function inc(): void {
  if (n.value < cap.value) n.value++;
}
function doMove(): void {
  if (cap.value < 1 || toId.value < 0) return;
  void store.move(fromId.value, toId.value, n.value);
}
</script>

<template>
  <ModalShell @close="store.closeModal()">
    <h2>🛸 REDEPLOY TROOPS</h2>
    <p class="dimtx">
      Move an army between your planets. Uses the origin's rockets (capacity
      {{ capFmt }}). Spends one 🛸 Move card (you have {{ human.hand.MOVE }}).
    </p>
    <p>
      From:
      <button
        v-for="pl in owned"
        :key="pl.id"
        class="tab"
        :class="{ active: pl.id === fromId }"
        @click="fromId = pl.id">
        {{ pl.name }} 🪖{{ pl.troops }}
      </button>
    </p>
    <div
      v-for="pl in dests"
      :key="pl.id"
      class="trow"
      :class="{ sel: pl.id === toId }"
      @click="toId = pl.id">
      <div class="tinfo">
        <b>{{ pl.name }}</b>
      </div>
      <div>🪖{{ pl.troops }}</div>
    </div>
    <p style="margin-top: 12px">
      Troops aboard:
      <span class="stepper">
        <button @click="dec">−</button><span class="sval">{{ n }}</span
        ><button @click="inc">+</button>
      </span>
      <span class="dimtx">({{ from.name }} garrisons {{ from.troops }})</span>
    </p>
    <div class="mbtns">
      <button class="btn" :disabled="cap < 1" @click="doMove">🛸 MOVE</button>
      <button class="btn" @click="store.closeModal()">Cancel</button>
    </div>
  </ModalShell>
</template>
