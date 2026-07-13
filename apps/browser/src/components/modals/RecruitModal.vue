<script setup lang="ts">
import { computed } from 'vue';
import { recruitTroops } from '@seven-planets/game';
import { useGameStore, useUiStore } from '@/stores';
import ModalShell from './ModalShell.vue';
import { canAfford, costLabel } from '@seven-planets/game';
import { ownedPlanets } from '@seven-planets/game';
import { recruitCost } from '@seven-planets/game';
import { recruitYield } from '@seven-planets/game';

const game = useGameStore();
const ui = useUiStore();

const barracksPls = computed(() => {
  const state = game.state;
  const human = state.players[0];
  return ownedPlanets(state, human).filter(
    (planet) =>
      planet.buildings.BARRACKS && canAfford(human.hand, recruitCost(planet)),
  );
});

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
      its yield (1/2/4) and costs 1⛏️ per troop, plus one 🪖 card.
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
            recruitYield(planet)
          }}
          troops for {{ costLabel(recruitCost(planet)) }}</span
        >
      </div>
      <div>🪖{{ planet.troops }}</div>
    </div>
    <div class="mbtns">
      <button class="btn" @click="ui.closeModal()">Cancel</button>
    </div>
  </ModalShell>
</template>
