<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { createAttackPlanetAction, dispatch } from '@seven-planets/game';
import { useGameStore, useUiStore } from '@/stores';
import ModalShell from './ModalShell.vue';
import {
  COMBAT,
  CONQUEST_TRUCE,
  HOME_FIELD,
  PACIFIST_DEF_BONUS,
} from '@seven-planets/game';
import { computeShieldDefense } from '@seven-planets/game';
import type { Planet } from '@seven-planets/game';
import { battleWinProb } from '@seven-planets/ai';
import { getHandSize } from '@seven-planets/game';
import { isPacifist } from '@seven-planets/game';
import { getOwnedPlanets } from '@seven-planets/game';
import { computePacifistDefenseBonus } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';
import { computeSiloBonus } from '@seven-planets/game';
import { computeSingularityDefenseBonus } from '@seven-planets/game';
import { isUnderTruce } from '@seven-planets/game';

const game = useGameStore();
const ui = useUiStore();

const human = game.state.players[0];

const breaksVow = computed(() => isPacifist(human));

const siloPlanets = getOwnedPlanets(game.state, human).filter(
  (planet) => planet.buildings.SILO && planet.troops >= 1,
);
const sourceId = ref(
  siloPlanets.reduce((strongest, planet) =>
    strongest.troops >= planet.troops ? strongest : planet,
  ).id,
);
const selectedId = ref(-1);
const troopCount = ref(1);

const source = computed(() => game.state.planets[sourceId.value]);
const sources = computed(() =>
  getOwnedPlanets(game.state, human).filter((planet) => planet.buildings.SILO),
);
const targets = computed(() =>
  game.state.planets.filter((planet: Planet) => planet.ownerId !== 0),
);
const openTargets = computed(() =>
  targets.value.filter((planet: Planet) => !isUnderTruce(planet)),
);
const capacity = computed(() =>
  Math.min(getRocketCapacity(source.value), source.value.troops),
);

// Keep the selected target valid and the troop count within capacity.
watch(
  [openTargets, sourceId],
  () => {
    if (
      !openTargets.value.some(
        (planet: Planet) => planet.id === selectedId.value,
      )
    )
      selectedId.value = openTargets.value.length
        ? openTargets.value[0].id
        : -1;
    troopCount.value = Math.max(1, Math.min(troopCount.value, capacity.value));
  },
  { immediate: true },
);

const target = computed(() =>
  selectedId.value >= 0 ? game.state.planets[selectedId.value] : null,
);
const canLaunch = computed(
  () => selectedId.value >= 0 && source.value.troops >= 1,
);

const preview = computed(() => {
  if (!target.value) return null;
  const attackPower = 2 * troopCount.value + computeSiloBonus(source.value);
  const defensePower =
    2 * target.value.troops +
    computeShieldDefense(target.value) +
    computePacifistDefenseBonus(game.state, target.value) +
    computeSingularityDefenseBonus(target.value) +
    HOME_FIELD;
  // exact P(win), same math the dice roll
  const winProbability = battleWinProb(attackPower, defensePower);
  const winPercent = Math.round(winProbability * 100);
  const note =
    winProbability >= 0.6
      ? 'good'
      : winProbability >= 0.35
        ? 'close'
        : 'suicide';
  const sendingAll = troopCount.value >= source.value.troops;
  return {
    attackPower,
    defensePower,
    winProbability,
    winPercent,
    note,
    sendingAll,
  };
});

function capacityLabel(planet = source.value): string {
  const cap = getRocketCapacity(planet);
  return cap === Infinity ? '∞ (all troops)' : String(cap);
}
function selectTarget(planet: { id: number; truce: boolean }): void {
  if (!planet.truce) selectedId.value = planet.id;
}
function decrease(): void {
  if (troopCount.value > 1) troopCount.value--;
}
function increase(): void {
  if (troopCount.value < capacity.value) troopCount.value++;
}
function launch(): void {
  if (!canLaunch.value) return;
  ui.closeModal();
  dispatch(
    createAttackPlanetAction({
      playerId: 0,
      sourceId: sourceId.value,
      targetId: selectedId.value,
      troops: troopCount.value,
    }),
  );
}
</script>

<template>
  <ModalShell @close="ui.closeModal()">
    <h2>🚀 LAUNCH ATTACK</h2>
    <p class="dimtx">
      Rockets launch only from planets with a 🚀 Rocket Silo, using that
      planet's own army. Winning a battle grants no loot — wipe out the garrison
      to conquer the planet (then it's safe from attacks for
      {{ CONQUEST_TRUCE }} turns). Spends one ⚔️ Attack card (you have
      {{ human.hand.ATTACK }}).
    </p>
    <p v-if="breaksVow" class="vow-warning">
      ☮️➡️⚔️ You are a PACIFIST. Launching this attack breaks your vow
      <strong>permanently</strong>: you lose the +defense and +⭐ bonuses on
      every planet and can never become a PACIFIST again.
    </p>
    <p v-if="sources.length > 1">
      Launch from:
      <button
        v-for="planet in sources"
        :key="planet.id"
        class="tab"
        :class="{ active: planet.id === sourceId }"
        @click="sourceId = planet.id">
        {{ planet.name }} 🪖{{ planet.troops }}
      </button>
    </p>
    <div
      v-for="planet in targets"
      :key="planet.id"
      class="trow"
      :class="{ sel: planet.id === selectedId, truce: isUnderTruce(planet) }"
      @click="selectTarget({ id: planet.id, truce: isUnderTruce(planet) })">
      <div class="tinfo">
        <b :style="{ color: game.state.players[planet.ownerId].color }">{{
          planet.name
        }}</b>
        — {{ game.state.players[planet.ownerId].name }}
        <span v-if="isUnderTruce(planet)" class="dimtx">
          🕊️ truce ({{ planet.protectedUntil - game.state.turn + 1 }} turn{{
            planet.protectedUntil - game.state.turn ? 's' : ''
          }})
        </span>
      </div>
      <div>
        🪖{{ planet.troops }} {{ '🛡️'.repeat(planet.buildings.SHIELD || 0) }}
        <span
          v-if="game.state.players[planet.ownerId].hasPacifistStatus"
          v-tooltip="`Pacifist — +${PACIFIST_DEF_BONUS} defense`"
          >☮️</span
        >
        🃏{{ getHandSize(game.state.players[planet.ownerId]) }}
      </div>
    </div>
    <p style="margin-top: 12px">
      Troops aboard:
      <span class="stepper">
        <button @click="decrease">−</button
        ><span class="sval">{{ troopCount }}</span
        ><button @click="increase">+</button>
      </span>
      <span class="dimtx"
        >({{ source.name }} garrisons {{ source.troops }}, rocket capacity
        {{ capacityLabel() }})</span
      >
    </p>
    <p>
      <template v-if="preview">
        Your strike {{ preview.attackPower }} + 🎲0-{{
          COMBAT.attackRoll
        }}
        &nbsp;vs&nbsp; defense {{ preview.defensePower }} + 🎲0-{{
          COMBAT.defenseRoll
        }}<br />
        <b
          :style="{
            color:
              preview.note === 'good'
                ? '#7dff8a'
                : preview.note === 'close'
                  ? '#ffd23d'
                  : '#ff6b6b',
          }"
          >Win chance: {{ preview.winPercent }}%</b
        >
        —
        <span v-if="preview.note === 'good'" style="color: #7dff8a"
          >odds look good.</span
        >
        <span v-else-if="preview.note === 'close'" style="color: #ffd23d"
          >close fight, luck decides.</span
        >
        <span v-else class="warn">likely suicide.</span>
        <span v-if="preview.sendingAll" class="warn">
          Sending everyone leaves {{ source.name }} defenseless!</span
        >
      </template>
      <span v-else class="warn"
        >All enemy planets are under truce — no valid target.</span
      >
    </p>
    <div class="mbtns">
      <button class="btn danger" :disabled="!canLaunch" @click="launch">
        🚀 LAUNCH
      </button>
      <button class="btn" @click="ui.closeModal()">Cancel</button>
    </div>
  </ModalShell>
</template>

<style scoped>
.vow-warning {
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 107, 107, 0.55);
  border-radius: 6px;
  background: rgba(255, 107, 107, 0.1);
  color: #ffb0b0;
  font-size: 12.5px;
  line-height: 1.45;
}
</style>
