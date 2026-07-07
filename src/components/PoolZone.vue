<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/game';
import {
  BUILDINGS,
  buildingCost,
  CARDS,
  costLabel,
  INFLUENCE_CARDS,
  maxLevel,
} from '@/game/constants';
import { canPickCard } from '@/game/engine/functions/can-pick-card';
import { homePlanet } from '@/game/engine/functions/home-planet';
import type { BuildingType, InfluenceType, PoolType } from '@/game/types';

const store = useGameStore();
const state = store.state;

interface PoolCardVM {
  i: number;
  type: PoolType;
  kind: 'building' | 'influence' | 'regular';
  cls: string;
  color: string;
  valid: boolean;
  icon: string;
  name: string;
  cost?: string;
  bonus?: string;
  badge?: string;
  title: string;
}

const hints: Partial<Record<PoolType, string>> = {
  ATTACK:
    ' (needs a 🚀 Rocket Silo and at least 1 soldier to pick — attacks launch only from Silo planets)',
  MOVE: ' (needs a 🛰️ Spaceport and 2+ planets to pick — redeploys troops between your planets)',
  RECRUIT:
    ' (needs a 🎖️ Barracks to pick — recruiting is impossible without one)',
  TRADE: ' (needs a 🤝 Embassy to pick — trading is impossible without one)',
};

const poolCards = computed<PoolCardVM[]>(() => {
  if (state.phase !== 'draft' || state.over) return [];
  const picking = store.isPicking;
  const human = state.players[0];
  const draftPl = state.planets[state.draftPlanetId] || homePlanet(human);
  return state.pool.map((t, i) => {
    const c = CARDS[t];
    const valid = picking && canPickCard(human, t, draftPl);
    const base = `card ${picking ? (valid ? 'pickable' : 'locked') : ''} ${c.action ? 'action' : ''}`;
    if (c.building) {
      const bt = t as BuildingType;
      const B = BUILDINGS[bt];
      const cur = picking ? draftPl.buildings[bt] || 0 : 0;
      const next = Math.min(cur + 1, maxLevel(bt));
      const badge = cur > 0 && cur < maxLevel(bt) ? ` ⬆L${cur + 1}` : '';
      const cost = costLabel(buildingCost(bt, next));
      return {
        i,
        type: t,
        kind: 'building',
        cls: base + ' bcard',
        color: c.color,
        valid,
        icon: B.icon,
        name: B.name,
        cost,
        bonus: B.short,
        badge,
        title: `${B.name}: ${B.desc} — cost ${cost} for level ${next} (level N costs N× base, max L${maxLevel(bt)}, capped by your tech). Picking builds or upgrades it instantly on the drafting planet.`,
      };
    }
    if (c.influenceCard) {
      const IC = INFLUENCE_CARDS[t as InfluenceType];
      return {
        i,
        type: t,
        kind: 'influence',
        cls: base + ' bcard',
        color: c.color,
        valid,
        icon: IC.icon,
        name: IC.name,
        cost: `${IC.cost}⭐`,
        bonus: 'influence',
        title: `${IC.name}: ${IC.desc} — costs ${IC.cost}⭐ Influence now; goes to your hand and can be played on any of your action turns.`,
      };
    }
    return {
      i,
      type: t,
      kind: 'regular',
      cls: base,
      color: c.color,
      valid,
      icon: c.icon,
      name: c.name,
      title: `${c.name}${hints[t] || ''}`,
    };
  });
});

function pick(vm: PoolCardVM): void {
  if (store.isPicking && vm.valid) store.pickCard(vm.i);
}
</script>

<template>
  <div id="pool-zone">
    <div id="status">{{ state.status }}</div>
    <div id="pool">
      <div
        v-for="vm in poolCards"
        :key="vm.i"
        :class="vm.cls"
        :style="{ borderColor: vm.color }"
        :title="vm.title"
        @click="pick(vm)">
        <template v-if="vm.kind === 'regular'">
          <div class="ic">{{ vm.icon }}</div>
          <div class="nm">{{ vm.name }}</div>
        </template>
        <template v-else>
          <div class="bhead">
            <span class="bic2">{{ vm.icon }}</span
            ><span class="bnm">{{ vm.name }}{{ vm.badge }}</span>
          </div>
          <div class="bcost2">{{ vm.cost }}</div>
          <div class="bbonus">{{ vm.bonus }}</div>
        </template>
      </div>
    </div>
  </div>
</template>
