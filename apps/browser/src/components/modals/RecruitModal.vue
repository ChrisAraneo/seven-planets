<script setup lang="ts">
import { computed } from 'vue';
import { recruitTroops } from '@seven-planets/game';
import { noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { useGameStore, useUiStore } from '@/stores';
import { chain } from '@/utils/chain';
import ModalShell from './ModalShell.vue';
import { getOwnedPlanets } from '@seven-planets/game';
import { computeRecruitableTroops } from '@seven-planets/game';
import { computeRecruitYield } from '@seven-planets/game';

const game = useGameStore();
const ui = useUiStore();

const barracksPls = computed(() =>
  getOwnedPlanets(game.state, game.state.players[0]).filter(
    (planet) =>
      planet.buildings.BARRACKS &&
      computeRecruitableTroops(planet, game.state.players[0].hand) >= 1,
  ),
);

const troopsFor = (planetId: number): number =>
  computeRecruitableTroops(
    game.state.planets[planetId],
    game.state.players[0].hand,
  );

const shortWarning = (planetId: number): string =>
  chain({
    affordable: troopsFor(planetId),
    yieldTotal: computeRecruitYield(game.state.planets[planetId]),
  })
    .thru(({ affordable, yieldTotal }) =>
      match(affordable < yieldTotal)
        .with(
          true,
          () => ` ⚠️ only enough ⛏️ for ${affordable} of ${yieldTotal} troops`,
        )
        .otherwise(() => ''),
    )
    .value();

const recruit = (planetId: number): void =>
  chain(ui.closeModal())
    .thru(() => recruitTroops({ playerId: 0, planetId }))
    .thru(noop)
    .value();
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
      @click="recruit(planet.id)"
    >
      <div class="tinfo">
        <b>{{ planet.name }}</b>
        <span class="dimtx">🎖️ Barracks L{{ planet.buildings.BARRACKS }} → +{{
          troopsFor(planet.id)
        }}
          troops for {{ troopsFor(planet.id) }}⛏️{{
            shortWarning(planet.id)
          }}</span>
      </div>
      <div>🪖{{ planet.troops }}</div>
    </div>
    <div class="mbtns">
      <button
        class="btn"
        @click="ui.closeModal()"
      >
        Cancel
      </button>
    </div>
  </ModalShell>
</template>
