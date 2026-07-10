<script setup lang="ts">
import { computed } from 'vue';
import { store } from '@/stores';
import ModalShell from './ModalShell.vue';
import { canAfford, costLabel } from '@seven-planets/game';
import { ownedPlanets } from '@seven-planets/game';
import { recruitCost } from '@seven-planets/game';
import { recruitYield } from '@seven-planets/game';

const barracksPls = computed(() => {
  const state = store.state.game.state;
  const human = state.players[0];
  return ownedPlanets(state, human).filter(
    (pl) => pl.buildings.BARRACKS && canAfford(human.hand, recruitCost(pl)),
  );
});

function recruit(planetId: number): void {
  store.commit('ui/closeModal');
  void store.dispatch('game/recruitTroops', { playerId: 0, planetId });
}
</script>

<template>
  <ModalShell @close="store.commit('ui/closeModal')">
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
      <button class="btn" @click="store.commit('ui/closeModal')">Cancel</button>
    </div>
  </ModalShell>
</template>
