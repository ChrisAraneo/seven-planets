<script setup lang="ts">
import { computed } from 'vue';
import { recruitTroops } from '@seven-planets/game';
import { useGameStore, useUiStore } from '@/stores';
import ModalShell from './ModalShell.vue';
import { getOwnedPlanets } from '@seven-planets/game';
import { computeRecruitableTroops } from '@seven-planets/game';
import { computeRecruitYield } from '@seven-planets/game';

const game = useGameStore();
const ui = useUiStore();

const barracksPls = computed(() => {
  const state = game.state;
  const human = state.players[0];
  return getOwnedPlanets(state, human).filter(
    (planet) =>
      planet.buildings.BARRACKS &&
      computeRecruitableTroops(planet, human.hand) >= 1,
  );
});

function troopsFor(planetId: number): number {
  return computeRecruitableTroops(
    game.state.planets[planetId],
    game.state.players[0].hand,
  );
}

function shortWarning(planetId: number): string {
  const planet = game.state.planets[planetId];
  const affordable = troopsFor(planetId);
  return affordable < computeRecruitYield(planet)
    ? ` ⚠️ only enough ⛏️ for ${affordable} of ${computeRecruitYield(planet)} troops`
    : '';
}

function recruit(planetId: number): void {
  ui.closeModal();
  void recruitTroops({ playerId: 0, planetId });
}
</script>

<template>
  <ModalShell @close="ui.closeModal()">
    <h2>🪖 RECRUIT</h2>
    <p class="dimtx">
      Recruiting needs a 🎖️ Barracks — each recruitment yields troops equal to
      its yield (1/2/4) and costs 1⛏️ per troop, plus one 🪖 card. Short on ⛏️,
      you recruit as many troops as you can pay for.
    </p>
    <div
      v-for="planet in barracksPls"
      :key="planet.id"
      class="trow"
      @click="recruit(planet.id)">
      <div class="tinfo">
        <b>{{ planet.name }}</b>
        <span class="dimtx"
          >🎖️ Barracks L{{ planet.buildings.BARRACKS }} → +{{
            troopsFor(planet.id)
          }}
          troops for {{ troopsFor(planet.id) }}⛏️{{
            shortWarning(planet.id)
          }}</span
        >
      </div>
      <div>🪖{{ planet.troops }}</div>
    </div>
    <div class="mbtns">
      <button class="btn" @click="ui.closeModal()">Cancel</button>
    </div>
  </ModalShell>
</template>
