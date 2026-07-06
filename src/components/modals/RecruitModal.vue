<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import ModalShell from './ModalShell.vue'
import { canAfford, costLabel } from '@/game/constants'
import { ownedPlanets, recruitCost, recruitYield } from '@/game/engine'

const store = useGameStore()

const barracksPls = computed(() =>
  ownedPlanets(store.human).filter((pl) => pl.buildings.BARRACKS && canAfford(store.human.hand, recruitCost(pl))),
)
</script>

<template>
  <ModalShell @close="store.closeModal()">
    <h2>🪖 RECRUIT</h2>
    <p class="dimtx">
      Recruiting needs a 🎖️ Barracks — each recruitment yields troops equal to its yield (1/2/4) and costs 1⛏️ per
      troop, plus one 🪖 card.
    </p>
    <div v-for="pl in barracksPls" :key="pl.id" class="trow" @click="store.recruit(pl.id)">
      <div class="tinfo">
        <b>{{ pl.name }}</b>
        <span class="dimtx">🎖️ Barracks L{{ pl.buildings.BARRACKS }} → +{{ recruitYield(pl) }} troops for {{ costLabel(recruitCost(pl)) }}</span>
      </div>
      <div>🪖{{ pl.troops }}</div>
    </div>
    <div class="mbtns"><button class="btn" @click="store.closeModal()">Cancel</button></div>
  </ModalShell>
</template>
