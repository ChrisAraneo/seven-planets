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
    (pl) => pl.buildings.BARRACKS && canAfford(human.hand, recruitCost(pl)),
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
      v-for="pl in barracksPls"
      :key="pl.id"
      class="trow"
      @click="recruit(pl.id)">
      <div class="tinfo">
        <b>{{ pl.name }}</b>
        <span class="dimtx"
          >🎖️ Barracks L{{ pl.buildings.BARRACKS }} → +{{
            recruitYield(pl)
          }}
          troops for {{ costLabel(recruitCost(pl)) }}</span
        >
      </div>
      <div>🪖{{ pl.troops }}</div>
    </div>
    <div class="mbtns">
      <button class="btn" @click="ui.closeModal()">Cancel</button>
    </div>
  </ModalShell>
</template>
