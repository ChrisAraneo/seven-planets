<script setup lang="ts">
import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { computed, ref, watch } from 'vue';
import { moveTroops } from '@seven-planets/game';
import { useGameStore, useUiStore } from '@/stores';
import { chain } from '@/utils/chain';
import ModalShell from './ModalShell.vue';
import { getOwnedPlanets } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';

const game = useGameStore();
const ui = useUiStore();

const human = game.state.players[0];

const sources = computed(() =>
  getOwnedPlanets(game.state, human).filter(
    (planet) => planet.buildings.SPACEPORT,
  ),
);

const fromId = ref(
  match(sources.value.length)
    .with(0, () => getOwnedPlanets(game.state, human))
    .otherwise(() => sources.value)
    .reduce((strongest, planet) =>
      match(strongest.troops >= planet.troops)
        .with(true, () => strongest)
        .otherwise(() => planet),
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
  () =>
    chain(dests.value)
      .tap((destinations) =>
        match(destinations.some((planet) => planet.id === toId.value))
          .with(false, () =>
            assign(toId, {
              value: match(destinations.length)
                .with(0, () => -1)
                .otherwise(() => destinations[0].id),
            }),
          )
          .otherwise(noop),
      )
      .tap(() =>
        assign(troopCount, {
          value: Math.max(
            1,
            Math.min(troopCount.value, Math.max(1, capacity.value)),
          ),
        }),
      )
      .thru(noop)
      .value(),
  { immediate: true },
);

const capacityLabel = computed(() =>
  match(getRocketCapacity(from.value))
    .with(Infinity, () => '∞ (all troops)')
    .otherwise((cap) => String(cap)),
);

const decrease = (): void =>
  match(troopCount.value > 1)
    .with(true, () =>
      chain(assign(troopCount, { value: troopCount.value - 1 }))
        .thru(noop)
        .value(),
    )
    .otherwise(noop);
const increase = (): void =>
  match(troopCount.value < capacity.value)
    .with(true, () =>
      chain(assign(troopCount, { value: troopCount.value + 1 }))
        .thru(noop)
        .value(),
    )
    .otherwise(noop);
const doMove = (): void =>
  match(capacity.value < 1 || toId.value < 0)
    .with(true, noop)
    .otherwise(() =>
      chain(ui.closeModal())
        .thru(() =>
          moveTroops({
            playerId: 0,
            fromId: fromId.value,
            toId: toId.value,
            troops: troopCount.value,
          }),
        )
        .thru(noop)
        .value(),
    );
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
        @click="fromId = planet.id"
      >
        {{ planet.name }} 🪖{{ planet.troops }}
      </button>
    </p>
    <div
      v-for="planet in dests"
      :key="planet.id"
      class="trow"
      :class="{ sel: planet.id === toId }"
      @click="toId = planet.id"
    >
      <div class="tinfo">
        <b>{{ planet.name }}</b>
      </div>
      <div>🪖{{ planet.troops }}</div>
    </div>
    <p style="margin-top: 12px">
      Troops aboard:
      <span class="stepper">
        <button @click="decrease">−</button><span class="sval">{{ troopCount }}</span><button @click="increase">+</button>
      </span>
      <span class="dimtx">({{ from.name }} garrisons {{ from.troops }})</span>
    </p>
    <div class="mbtns">
      <button
        class="btn"
        :disabled="capacity < 1"
        @click="doMove"
      >
        🛸 MOVE
      </button>
      <button
        class="btn"
        @click="ui.closeModal()"
      >
        Cancel
      </button>
    </div>
  </ModalShell>
</template>
