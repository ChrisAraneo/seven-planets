<script setup lang="ts">
import { computed } from 'vue';
import { pickCard } from '@seven-planets/game';
import { useGameStore } from '@/stores';
import {
  BUILDINGS,
  computeBuildingCost,
  CARDS,
  getCostLabel,
  INFLUENCE_CARDS,
  getMaxLevel,
} from '@seven-planets/game';
import { canPickCard } from '@seven-planets/game';
import { getHomePlanet } from '@seven-planets/game';
import type {
  BuildingType,
  InfluenceType,
  PoolType,
} from '@seven-planets/game';

const game = useGameStore();

// AwaitingPick is raised for every drafting seat, so scope the human's pool
// clicks to the human's own draft turn (seat 0).
const isPicking = computed(
  () =>
    game.state.awaitingPick && game.state.activeId === 0 && !game.state.over,
);

interface PoolCardVM {
  poolIndex: number;
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
  MOVE: ' (needs a 🛰️ Spaceport and 2+ planets to pick — troops redeploy only FROM a Spaceport planet)',
  RECRUIT:
    ' (needs a 🎖️ Barracks to pick — recruiting is impossible without one)',
  TRADE: ' (needs a 🤝 Embassy to pick — trading is impossible without one)',
};

const poolCards = computed<PoolCardVM[]>(() => {
  const state = game.state;
  if (state.phase !== 'draft' || state.over) return [];
  const picking = isPicking.value;
  const human = state.players[0];
  const getDraftPlanet =
    state.planets[state.draftPlanetId] || getHomePlanet(state, human);
  return state.pool.map((poolType: PoolType, poolIndex: number) => {
    const card = CARDS[poolType];
    const valid =
      picking && canPickCard(state, human, poolType, getDraftPlanet);
    const base = `card ${picking ? (valid ? 'pickable' : 'locked') : ''} ${card.action ? 'action' : ''}`;
    if (card.building) {
      const buildingType = poolType as BuildingType;
      const buildingDef = BUILDINGS[buildingType];
      const cur = picking ? getDraftPlanet.buildings[buildingType] || 0 : 0;
      const next = Math.min(cur + 1, getMaxLevel(buildingType));
      const badge =
        cur > 0 && cur < getMaxLevel(buildingType) ? ` ⬆L${cur + 1}` : '';
      const cost = getCostLabel(computeBuildingCost(buildingType, next));
      return {
        poolIndex,
        type: poolType,
        kind: 'building',
        cls: base + ' bcard',
        color: card.color,
        valid,
        icon: buildingDef.icon,
        name: buildingDef.name,
        cost,
        bonus: buildingDef.short,
        badge,
        title: `${buildingDef.name}: ${buildingDef.desc} — cost ${cost} for level ${next} (level N costs N× base, max L${getMaxLevel(buildingType)}, capped by your tech). Picking builds or upgrades it instantly on the drafting planet.`,
      };
    }
    if (card.influenceCard) {
      const influenceCard = INFLUENCE_CARDS[poolType as InfluenceType];
      return {
        poolIndex,
        type: poolType,
        kind: 'influence',
        cls: base + ' bcard',
        color: card.color,
        valid,
        icon: influenceCard.icon,
        name: influenceCard.name,
        cost: `${influenceCard.cost}⭐`,
        bonus: 'influence',
        title: `${influenceCard.name}: ${influenceCard.desc} — costs ${influenceCard.cost}⭐ Influence now; goes to your hand and can be played on any of your action turns.`,
      };
    }
    return {
      poolIndex,
      type: poolType,
      kind: 'regular',
      cls: base,
      color: card.color,
      valid,
      icon: card.icon,
      name: card.name,
      title: `${card.name}${hints[poolType] || ''}`,
    };
  });
});

function pick(poolCard: PoolCardVM): void {
  if (isPicking.value && poolCard.valid)
    void pickCard({ playerId: 0, index: poolCard.poolIndex });
}
</script>

<template>
  <div id="pool-zone">
    <div id="status">{{ game.state.status }}</div>
    <div id="pool">
      <div
        v-for="poolCard in poolCards"
        :key="poolCard.poolIndex"
        :class="poolCard.cls"
        :style="{ borderColor: poolCard.color }"
        v-tooltip="poolCard.title"
        @click="pick(poolCard)">
        <template v-if="poolCard.kind === 'regular'">
          <div class="ic">{{ poolCard.icon }}</div>
          <div class="nm">{{ poolCard.name }}</div>
        </template>
        <template v-else>
          <div class="bhead">
            <span class="bic2">{{ poolCard.icon }}</span
            ><span class="bnm">{{ poolCard.name }}{{ poolCard.badge }}</span>
          </div>
          <div class="bcost2">{{ poolCard.cost }}</div>
          <div class="bbonus">{{ poolCard.bonus }}</div>
        </template>
      </div>
    </div>
  </div>
</template>
